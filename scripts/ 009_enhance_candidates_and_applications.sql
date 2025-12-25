-- 009_enhance_candidates_and_applications.sql

-- Add more fields to candidates table
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS availability text,
ADD COLUMN IF NOT EXISTS current_salary integer,
ADD COLUMN IF NOT EXISTS expected_salary integer,
ADD COLUMN IF NOT EXISTS notice_period integer,
ADD COLUMN IF NOT EXISTS last_contacted timestamp with time zone,
ADD COLUMN IF NOT EXISTS tags text[];

-- Add interview feedback fields
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS interviewer_feedback text,
ADD COLUMN IF NOT EXISTS interview_rating integer,
ADD COLUMN IF NOT EXISTS recommendation text;

-- Create table for offer details
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  salary_offered integer,
  start_date date,
  benefits text,
  status text DEFAULT 'pending', -- pending, accepted, rejected, negotiated
  notes text,
  offer_letter_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offers_select_own"
  ON public.offers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.applications a 
    WHERE a.id = offers.application_id 
    AND a.user_id = auth.uid()
  ));

CREATE POLICY "offers_insert_own"
  ON public.offers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.applications a 
    WHERE a.id = offers.application_id 
    AND a.user_id = auth.uid()
  ));

CREATE POLICY "offers_update_own"
  ON public.offers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.applications a 
    WHERE a.id = offers.application_id 
    AND a.user_id = auth.uid()
  ));

CREATE POLICY "offers_delete_own"
  ON public.offers FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.applications a 
    WHERE a.id = offers.application_id 
    AND a.user_id = auth.uid()
  ));