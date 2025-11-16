-- Create learning_sets table
CREATE TABLE public.learning_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '📚',
  color TEXT DEFAULT '#9b87f5',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flashcards table
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id UUID NOT NULL REFERENCES public.learning_sets(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.learning_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Create policies for learning_sets
CREATE POLICY "Users can view their own learning sets"
ON public.learning_sets
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own learning sets"
ON public.learning_sets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning sets"
ON public.learning_sets
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning sets"
ON public.learning_sets
FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for flashcards
CREATE POLICY "Users can view flashcards from their sets"
ON public.flashcards
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.learning_sets
    WHERE learning_sets.id = flashcards.set_id
    AND learning_sets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create flashcards in their sets"
ON public.flashcards
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.learning_sets
    WHERE learning_sets.id = flashcards.set_id
    AND learning_sets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update flashcards in their sets"
ON public.flashcards
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.learning_sets
    WHERE learning_sets.id = flashcards.set_id
    AND learning_sets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete flashcards from their sets"
ON public.flashcards
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.learning_sets
    WHERE learning_sets.id = flashcards.set_id
    AND learning_sets.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_learning_sets_updated_at
BEFORE UPDATE ON public.learning_sets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at
BEFORE UPDATE ON public.flashcards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();