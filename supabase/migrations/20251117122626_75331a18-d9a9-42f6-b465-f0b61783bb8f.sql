-- Add sharing columns to learning_sets table
ALTER TABLE public.learning_sets
ADD COLUMN is_public boolean DEFAULT false,
ADD COLUMN share_token text UNIQUE;

-- Create index for share_token lookups
CREATE INDEX idx_learning_sets_share_token ON public.learning_sets(share_token) WHERE share_token IS NOT NULL;

-- Update RLS policies for learning_sets to allow public access to shared sets
DROP POLICY IF EXISTS "Users can view their own learning sets" ON public.learning_sets;

CREATE POLICY "Users can view their own or shared learning sets"
ON public.learning_sets
FOR SELECT
USING (
  auth.uid() = user_id OR 
  (is_public = true AND share_token IS NOT NULL)
);

-- Update flashcards RLS to allow viewing flashcards from shared sets
DROP POLICY IF EXISTS "Users can view flashcards from their sets" ON public.flashcards;

CREATE POLICY "Users can view flashcards from their or shared sets"
ON public.flashcards
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM learning_sets
    WHERE learning_sets.id = flashcards.set_id
    AND (
      learning_sets.user_id = auth.uid() OR
      (learning_sets.is_public = true AND learning_sets.share_token IS NOT NULL)
    )
  )
);

-- Function to generate a unique share token
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token text;
  token_exists boolean;
BEGIN
  LOOP
    -- Generate random 12-character token
    token := encode(gen_random_bytes(9), 'base64');
    token := replace(replace(replace(token, '/', ''), '+', ''), '=', '');
    token := substring(token, 1, 12);
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM learning_sets WHERE share_token = token) INTO token_exists;
    
    EXIT WHEN NOT token_exists;
  END LOOP;
  
  RETURN token;
END;
$$;