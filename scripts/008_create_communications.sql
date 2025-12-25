-- Create communications table to track candidate interactions
CREATE TABLE IF NOT EXISTS public.communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- email, phone, meeting, note
  subject text,
  content text NOT NULL,
  scheduled_for timestamp with time zone,
  status text DEFAULT 'completed', -- scheduled, completed, cancelled
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

-- Create policies for communications
CREATE POLICY "communications_select_own"
  ON public.communications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "communications_insert_own"
  ON public.communications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "communications_update_own"
  ON public.communications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "communications_delete_own"
  ON public.communications FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS communications_candidate_id_idx ON public.communications(candidate_id);
CREATE INDEX IF NOT EXISTS communications_user_id_idx ON public.communications(user_id);
CREATE INDEX IF NOT EXISTS communications_created_at_idx ON public.communications(created_at);
CREATE INDEX IF NOT EXISTS communications_type_idx ON public.communications(type);