-- ============================================================
-- BodyOS - User Archetype & Checkpoint System Migration
-- ============================================================
--
-- Run AFTER bodyos_database_expansion.sql
--
-- Adds:
-- - Archetype fields to profiles (weight, experience, philosophies, pain points)
-- - Body checkpoints table (time-series body scan sessions)
-- - Checkpoint photos table (individual angle photos with ML analysis)
-- - Storage bucket for checkpoint photos
-- - Activity feed trigger for completed checkpoints
--
-- ============================================================


-- ============================================================
-- 1. Expand Profiles with Archetype Fields
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS
  weight_kg numeric(5,2);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS
  experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS
  movement_philosophies text[] default '{}';
  -- Values: calisthenics, strength_training, powerlifting, olympic_lifting,
  --         yoga_flexibility, martial_arts, sprint_agility, functional_fitness,
  --         rehabilitation, hybrid_mixed

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS
  pain_points jsonb default '[]';
  -- Structure: [{"area": "lower_back", "severity": "moderate"}, ...]
  -- Areas: neck, shoulders, upper_back, lower_back, knees, ankles, wrists, hips, elbows, feet
  -- Severity: mild, moderate, severe


-- ============================================================
-- 2. Body Checkpoints (Time-Series Body Scan Sessions)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.body_checkpoints (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,

  checkpoint_date timestamptz default now(),
  status text check (status in ('pending', 'processing', 'completed', 'failed')) default 'pending',
  notes text,

  created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_body_checkpoints_user
  ON public.body_checkpoints(user_id, checkpoint_date desc);


-- ============================================================
-- 3. Checkpoint Photos (Individual Angle Photos + ML Analysis)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.checkpoint_photos (
  id uuid default gen_random_uuid() primary key,
  checkpoint_id uuid references public.body_checkpoints on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,

  -- Photo type: anterior (front), posterior (back), lateral_left, lateral_right
  photo_type text check (photo_type in ('anterior', 'posterior', 'lateral_left', 'lateral_right')) not null,

  -- Photo URLs
  photo_url text not null,              -- Original uploaded photo
  overlay_url text,                      -- ML-processed overlay image

  -- ML Analysis Results
  raw_landmarks jsonb,                   -- Raw 33-point landmark data from MediaPipe
  analysis_results jsonb,                -- Processed results: {score, issues[]}
  -- analysis_results structure:
  -- {
  --   "score": 82,
  --   "issues": [
  --     {"area": "shoulders", "description": "Slight elevation on left side", "severity": "mild"},
  --     {"area": "hips", "description": "Minor lateral tilt detected", "severity": "moderate"}
  --   ]
  -- }

  -- Processing state machine
  processing_status text check (processing_status in ('pending', 'processing', 'completed', 'failed')) default 'pending',
  processing_started_at timestamptz,
  processing_completed_at timestamptz,

  created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_checkpoint_photos
  ON public.checkpoint_photos(checkpoint_id, created_at);

CREATE INDEX IF NOT EXISTS idx_checkpoint_photos_user
  ON public.checkpoint_photos(user_id, created_at desc);


-- ============================================================
-- 4. Enable RLS
-- ============================================================

ALTER TABLE public.body_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoint_photos ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 5. RLS Policies - Body Checkpoints
-- ============================================================

CREATE POLICY "Users can view own checkpoints"
  ON public.body_checkpoints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkpoints"
  ON public.body_checkpoints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkpoints"
  ON public.body_checkpoints FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkpoints"
  ON public.body_checkpoints FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 6. RLS Policies - Checkpoint Photos
-- ============================================================

CREATE POLICY "Users can view own checkpoint photos"
  ON public.checkpoint_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkpoint photos"
  ON public.checkpoint_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkpoint photos"
  ON public.checkpoint_photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkpoint photos"
  ON public.checkpoint_photos FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 7. Storage Bucket for Checkpoint Photos
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('checkpoint-photos', 'checkpoint-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own checkpoint photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'checkpoint-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own checkpoint photos storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'checkpoint-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own checkpoint photos storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'checkpoint-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ============================================================
-- 8. Activity Feed Trigger for Completed Checkpoints
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_checkpoint_activity()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO public.activity_feed (user_id, activity_type, title, description, reference_type, reference_id)
    VALUES (
      NEW.user_id,
      'posture_scan',
      'Body Checkpoint Completed',
      'Full body alignment analysis processed',
      'body_checkpoint',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_checkpoint_completed
  AFTER UPDATE ON public.body_checkpoints
  FOR EACH ROW EXECUTE PROCEDURE public.create_checkpoint_activity();


-- ============================================================
-- COMPLETE
-- ============================================================
--
-- This migration adds:
-- ✅ Archetype fields on profiles (weight, experience, philosophies, pain points)
-- ✅ Body checkpoints table with processing status
-- ✅ Checkpoint photos with ML analysis storage
-- ✅ Full RLS policies for data isolation
-- ✅ Storage bucket with user-folder isolation
-- ✅ Activity feed trigger for checkpoint completion
--
-- ============================================================
