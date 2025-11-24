-- Fix the generate_share_token function to use correct search_path
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
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