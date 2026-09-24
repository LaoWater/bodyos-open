-- ============================================================
-- BodyOS - Comprehensive Database Schema
-- ============================================================
-- 
-- This migration EXPANDS the existing foundation to support:
-- - Complete user journey & onboarding
-- - Progress photo tracking (separate from posture assessments)
-- - Workout plans & scheduling
-- - AI conversation history (in-app + WhatsApp)
-- - Body measurements over time
-- - Achievement & milestone system
-- - Exercise library with coaching cues
-- - User preferences & settings
-- - WhatsApp integration
--
-- Run AFTER the initial migration.sql
-- ============================================================


-- ============================================================
-- 7. Expand Profiles with Onboarding & Preferences
-- ============================================================

-- Add columns to existing profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  onboarding_completed boolean default false;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  onboarding_step integer default 0;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  primary_goal text check (primary_goal in (
    'build_strength', 
    'improve_posture', 
    'lose_weight', 
    'gain_muscle', 
    'increase_mobility', 
    'rehab_injury',
    'general_fitness'
  ));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  available_time_per_session integer default 45; -- minutes

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  workout_days_per_week integer default 3 check (workout_days_per_week >= 1 and workout_days_per_week <= 7);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  preferred_workout_time text check (preferred_workout_time in ('morning', 'afternoon', 'evening', 'flexible'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  date_of_birth date;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  gender text check (gender in ('male', 'female', 'other', 'prefer_not_to_say'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  height_cm numeric(5,2);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  timezone text default 'UTC';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  language text default 'en';


-- ============================================================
-- 8. User Settings & Preferences
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid references auth.users on delete cascade primary key,
  
  -- Voice & Audio
  voice_feedback_enabled boolean default true,
  voice_id text default 'default', -- Eleven Labs voice ID
  voice_volume numeric(3,2) default 1.0 check (voice_volume >= 0 and voice_volume <= 1),
  rep_count_audio boolean default true,
  form_correction_audio boolean default true,
  
  -- Visual
  skeleton_overlay_enabled boolean default true,
  skeleton_color text default '#5B7CFA', -- Blueprint blue
  show_form_score_live boolean default true,
  show_rep_counter boolean default true,
  haptic_feedback_enabled boolean default true,
  
  -- Notifications
  push_notifications_enabled boolean default true,
  workout_reminders boolean default true,
  progress_updates boolean default true,
  ai_check_ins boolean default true,
  reminder_time time default '09:00',
  
  -- Privacy
  analytics_enabled boolean default true,
  crash_reporting_enabled boolean default true,
  
  -- Units
  use_metric boolean default true, -- true = kg/cm, false = lbs/inches
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- ============================================================
-- 9. Progress Photos (Separate from Posture Assessments)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.progress_photos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  
  photo_url text not null,
  photo_type text check (photo_type in ('front', 'side', 'back', 'custom')) not null,
  
  -- Optional body composition data (user-entered or from smart scale)
  weight_kg numeric(5,2),
  body_fat_percentage numeric(4,1),
  
  -- Metadata
  notes text,
  tags text[] default '{}',
  is_milestone boolean default false, -- Mark significant progress points
  
  taken_at timestamptz default now(), -- When photo was actually taken
  created_at timestamptz default now()
);

CREATE INDEX idx_progress_photos_user ON public.progress_photos(user_id, taken_at desc);


-- ============================================================
-- 10. Body Measurements (Tracked Over Time)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.body_measurements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  
  -- Weight
  weight_kg numeric(5,2),
  body_fat_percentage numeric(4,1),
  
  -- Circumference measurements (all in cm)
  neck_cm numeric(5,2),
  shoulders_cm numeric(5,2),
  chest_cm numeric(5,2),
  waist_cm numeric(5,2),
  hips_cm numeric(5,2),
  left_bicep_cm numeric(5,2),
  right_bicep_cm numeric(5,2),
  left_forearm_cm numeric(5,2),
  right_forearm_cm numeric(5,2),
  left_thigh_cm numeric(5,2),
  right_thigh_cm numeric(5,2),
  left_calf_cm numeric(5,2),
  right_calf_cm numeric(5,2),
  
  notes text,
  measured_at timestamptz default now(),
  created_at timestamptz default now()
);

CREATE INDEX idx_measurements_user ON public.body_measurements(user_id, measured_at desc);


-- ============================================================
-- 11. Posture Analysis Details (Expand existing)
-- ============================================================

-- Add detailed landmark storage to posture_assessments
ALTER TABLE public.posture_assessments ADD COLUMN IF NOT EXISTS 
  analysis_type text check (analysis_type in ('front', 'side', 'back', 'full')) default 'full';

ALTER TABLE public.posture_assessments ADD COLUMN IF NOT EXISTS 
  detailed_issues jsonb default '[]';
  -- Structure: [{issue: 'forward_head', severity: 0.7, angle_deviation: 15, recommendation: '...'}]

ALTER TABLE public.posture_assessments ADD COLUMN IF NOT EXISTS 
  comparison_to_previous jsonb;
  -- Structure: {overall_change: +5, improvements: ['hip_tilt'], regressions: [], unchanged: ['shoulder_elevation']}

ALTER TABLE public.posture_assessments ADD COLUMN IF NOT EXISTS 
  ai_summary text; -- AI-generated natural language summary


-- ============================================================
-- 12. Exercise Library (Reference Data)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.exercises (
  id uuid default gen_random_uuid() primary key,
  
  name text not null unique,
  slug text not null unique, -- URL-friendly: 'barbell-squat'
  category text check (category in (
    'compound', 'isolation', 'cardio', 'mobility', 'corrective'
  )) not null,
  
  muscle_groups text[] not null, -- ['quadriceps', 'glutes', 'hamstrings']
  equipment_required text[] default '{}', -- ['barbell', 'squat_rack']
  
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')) default 'intermediate',
  
  -- CV Analysis Support
  cv_tracking_enabled boolean default false, -- Do we have a trained model for this?
  landmark_focus text[] default '{}', -- Which landmarks matter most
  
  -- Coaching Cues (JSON structure for flexibility)
  coaching_cues jsonb default '{}',
  -- Structure:
  -- {
  --   setup: ["Feet shoulder-width apart", "Grip the bar..."],
  --   execution: ["Brace your core", "Break at the hips..."],
  --   common_mistakes: {
  --     "knee_cave": "Push your knees out over your toes",
  --     "butt_wink": "Don't go deeper than your mobility allows"
  --   },
  --   personalized_cues: {
  --     "anterior_pelvic_tilt": "Focus extra on bracing your core"
  --   },
  --   performance_tips: ["Squeeze glutes at lockout", "Drive through heels"]
  -- }
  
  video_demo_url text,
  thumbnail_url text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Seed some initial exercises
INSERT INTO public.exercises (name, slug, category, muscle_groups, equipment_required, cv_tracking_enabled, difficulty) VALUES
  ('Barbell Squat', 'barbell-squat', 'compound', ARRAY['quadriceps', 'glutes', 'hamstrings', 'core'], ARRAY['barbell', 'squat_rack'], true, 'intermediate'),
  ('Deadlift', 'deadlift', 'compound', ARRAY['hamstrings', 'glutes', 'lower_back', 'traps'], ARRAY['barbell'], true, 'intermediate'),
  ('Bench Press', 'bench-press', 'compound', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['barbell', 'bench'], true, 'intermediate'),
  ('Push-up', 'push-up', 'compound', ARRAY['chest', 'triceps', 'shoulders', 'core'], ARRAY[]::text[], true, 'beginner'),
  ('Plank', 'plank', 'isolation', ARRAY['core', 'shoulders'], ARRAY[]::text[], true, 'beginner'),
  ('Lunge', 'lunge', 'compound', ARRAY['quadriceps', 'glutes', 'hamstrings'], ARRAY[]::text[], true, 'beginner'),
  ('Romanian Deadlift', 'romanian-deadlift', 'compound', ARRAY['hamstrings', 'glutes', 'lower_back'], ARRAY['barbell', 'dumbbells'], true, 'intermediate'),
  ('Overhead Press', 'overhead-press', 'compound', ARRAY['shoulders', 'triceps', 'core'], ARRAY['barbell', 'dumbbells'], true, 'intermediate'),
  ('Barbell Row', 'barbell-row', 'compound', ARRAY['lats', 'rhomboids', 'biceps', 'rear_delts'], ARRAY['barbell'], true, 'intermediate'),
  ('Glute Bridge', 'glute-bridge', 'isolation', ARRAY['glutes', 'hamstrings'], ARRAY[]::text[], true, 'beginner')
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 13. Workout Plans
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workout_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  
  name text not null,
  description text,
  
  -- Plan metadata
  goal text check (goal in (
    'strength', 'hypertrophy', 'endurance', 'mobility', 'rehab', 'general'
  )),
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  duration_weeks integer default 4,
  days_per_week integer default 3,
  
  -- Generation metadata
  generated_by text check (generated_by in ('ai', 'user', 'template')) default 'ai',
  generation_context jsonb, -- What data the AI used to generate this
  
  is_active boolean default false, -- Currently assigned plan
  
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE INDEX idx_workout_plans_user ON public.workout_plans(user_id, is_active, created_at desc);


-- ============================================================
-- 14. Workout Plan Days
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workout_plan_days (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.workout_plans on delete cascade not null,
  
  day_number integer not null, -- 1, 2, 3, etc.
  name text, -- "Push Day", "Lower Body", etc.
  focus text, -- 'upper_push', 'lower', 'full_body', 'mobility', 'rest'
  
  estimated_duration_minutes integer default 45,
  
  notes text, -- AI-generated notes for this day
  
  created_at timestamptz default now()
);

CREATE INDEX idx_plan_days ON public.workout_plan_days(plan_id, day_number);


-- ============================================================
-- 15. Workout Plan Exercises (Exercise within a day)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workout_plan_exercises (
  id uuid default gen_random_uuid() primary key,
  plan_day_id uuid references public.workout_plan_days on delete cascade not null,
  exercise_id uuid references public.exercises on delete set null,
  
  order_index integer not null, -- Order within the day
  
  -- Prescription
  sets integer default 3,
  reps_min integer default 8,
  reps_max integer default 12,
  rest_seconds integer default 90,
  
  -- For timed exercises (planks, etc.)
  duration_seconds integer,
  
  -- RPE/Intensity guidance
  target_rpe integer check (target_rpe >= 1 and target_rpe <= 10), -- Rate of Perceived Exertion
  
  -- AI notes for this specific exercise for this user
  personalized_notes text, -- "Focus on bracing due to your hip tilt"
  
  -- Superset/circuit grouping
  superset_group integer, -- Exercises with same number are supersetted
  
  created_at timestamptz default now()
);

CREATE INDEX idx_plan_exercises ON public.workout_plan_exercises(plan_day_id, order_index);


-- ============================================================
-- 16. Scheduled Workouts (Calendar)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.scheduled_workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  plan_day_id uuid references public.workout_plan_days on delete set null,
  
  scheduled_for date not null,
  scheduled_time time,
  
  status text check (status in ('scheduled', 'completed', 'skipped', 'rescheduled')) default 'scheduled',
  
  -- Link to actual session if completed
  session_id uuid references public.exercise_sessions on delete set null,
  
  -- Rescheduling
  original_date date, -- If rescheduled, what was original date
  skip_reason text, -- If skipped, why
  
  reminder_sent boolean default false,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE INDEX idx_scheduled_workouts ON public.scheduled_workouts(user_id, scheduled_for);


-- ============================================================
-- 17. Expand Exercise Sessions with More Detail
-- ============================================================

ALTER TABLE public.exercise_sessions ADD COLUMN IF NOT EXISTS 
  plan_day_id uuid references public.workout_plan_days on delete set null;

ALTER TABLE public.exercise_sessions ADD COLUMN IF NOT EXISTS 
  scheduled_workout_id uuid references public.scheduled_workouts on delete set null;

ALTER TABLE public.exercise_sessions ADD COLUMN IF NOT EXISTS 
  duration_seconds integer;

ALTER TABLE public.exercise_sessions ADD COLUMN IF NOT EXISTS 
  calories_burned integer;

ALTER TABLE public.exercise_sessions ADD COLUMN IF NOT EXISTS 
  notes text;

ALTER TABLE public.exercise_sessions ADD COLUMN IF NOT EXISTS 
  mood_before text check (mood_before in ('great', 'good', 'okay', 'tired', 'stressed'));

ALTER TABLE public.exercise_sessions ADD COLUMN IF NOT EXISTS 
  mood_after text check (mood_after in ('great', 'good', 'okay', 'tired', 'stressed'));

ALTER TABLE public.exercise_sessions ADD COLUMN IF NOT EXISTS 
  ai_feedback text; -- AI-generated session summary


-- ============================================================
-- 18. Session Sets (More Detailed than Reps)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.session_sets (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.exercise_sessions on delete cascade not null,
  exercise_id uuid references public.exercises on delete set null,
  
  set_number integer not null,
  reps_completed integer,
  weight_kg numeric(6,2),
  
  -- Form tracking
  avg_form_score integer check (avg_form_score >= 0 and avg_form_score <= 100),
  issues_detected text[] default '{}',
  
  -- For timed exercises
  duration_seconds integer,
  
  -- RPE (user-entered)
  perceived_exertion integer check (perceived_exertion >= 1 and perceived_exertion <= 10),
  
  -- Rest tracking
  rest_taken_seconds integer,
  
  created_at timestamptz default now()
);

CREATE INDEX idx_session_sets ON public.session_sets(session_id, set_number);


-- ============================================================
-- 19. AI Conversations (In-App)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  
  title text, -- Auto-generated or user-set
  
  -- Conversation state
  is_active boolean default true,
  
  -- Context that was provided to the AI
  context_snapshot jsonb, -- Snapshot of user data at conversation start
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id, updated_at desc);


-- ============================================================
-- 20. AI Messages (Within Conversations)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.ai_conversations on delete cascade not null,
  
  role text check (role in ('user', 'assistant', 'system')) not null,
  content text not null,
  
  -- For assistant messages
  model_used text, -- 'claude-3-sonnet', etc.
  tokens_used integer,
  
  -- For messages with attachments
  attachments jsonb default '[]', -- [{type: 'image', url: '...'}]
  
  -- Message metadata
  feedback text check (feedback in ('helpful', 'not_helpful')),
  
  created_at timestamptz default now()
);

CREATE INDEX idx_ai_messages_conversation ON public.ai_messages(conversation_id, created_at);


-- ============================================================
-- 21. WhatsApp Integration
-- ============================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  
  phone_number text not null, -- E.164 format: +1234567890
  phone_verified boolean default false,
  
  -- WhatsApp Business API
  wa_id text, -- WhatsApp user ID
  
  -- Connection status
  is_active boolean default true,
  opted_in_at timestamptz,
  opted_out_at timestamptz,
  
  -- Preferences
  allow_proactive_messages boolean default true, -- Can AI initiate?
  quiet_hours_start time,
  quiet_hours_end time,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  
  -- WhatsApp message IDs
  wa_message_id text unique,
  
  direction text check (direction in ('inbound', 'outbound')) not null,
  
  -- Content
  message_type text check (message_type in ('text', 'image', 'voice', 'document')) default 'text',
  content text,
  media_url text,
  
  -- AI processing
  ai_conversation_id uuid references public.ai_conversations on delete set null,
  processed boolean default false,
  
  -- Delivery status (for outbound)
  status text check (status in ('sent', 'delivered', 'read', 'failed')),
  
  created_at timestamptz default now()
);

CREATE INDEX idx_whatsapp_messages_user ON public.whatsapp_messages(user_id, created_at desc);


-- ============================================================
-- 22. Goals & Milestones
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  
  goal_type text check (goal_type in (
    'weight', 'body_fat', 'strength', 'posture', 'consistency', 'custom'
  )) not null,
  
  title text not null,
  description text,
  
  -- Target values
  target_value numeric(10,2),
  target_unit text, -- 'kg', 'reps', 'score', 'days'
  current_value numeric(10,2),
  starting_value numeric(10,2),
  
  -- For strength goals
  exercise_id uuid references public.exercises on delete set null,
  
  -- Timeline
  target_date date,
  
  -- Status
  status text check (status in ('active', 'completed', 'abandoned')) default 'active',
  completed_at timestamptz,
  
  -- AI tracking
  last_ai_check_in timestamptz,
  ai_encouragement text, -- Latest AI message about this goal
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE INDEX idx_user_goals ON public.user_goals(user_id, status, created_at desc);


-- ============================================================
-- 23. Achievements
-- ============================================================

CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid default gen_random_uuid() primary key,
  
  slug text unique not null,
  name text not null,
  description text not null,
  icon text, -- Icon identifier
  category text check (category in ('consistency', 'strength', 'posture', 'milestone', 'social')),
  
  -- Unlock criteria (JSON for flexibility)
  criteria jsonb not null,
  -- Examples:
  -- {"type": "streak", "days": 7}
  -- {"type": "sessions_completed", "count": 10}
  -- {"type": "posture_improvement", "points": 10}
  -- {"type": "weight_lifted", "exercise": "barbell-squat", "kg": 100}
  
  points integer default 10,
  is_secret boolean default false, -- Hidden until unlocked
  
  created_at timestamptz default now()
);

-- Seed some achievements
INSERT INTO public.achievements (slug, name, description, category, criteria, points) VALUES
  ('first-session', 'First Steps', 'Complete your first workout session', 'milestone', '{"type": "sessions_completed", "count": 1}', 10),
  ('week-streak', 'Week Warrior', 'Work out 7 days in a row', 'consistency', '{"type": "streak", "days": 7}', 50),
  ('month-streak', 'Monthly Master', 'Work out for 30 days straight', 'consistency', '{"type": "streak", "days": 30}', 200),
  ('posture-improved', 'Standing Tall', 'Improve your posture score by 10 points', 'posture', '{"type": "posture_improvement", "points": 10}', 100),
  ('perfect-form', 'Perfect Rep', 'Score 100% form on any exercise', 'strength', '{"type": "form_score", "score": 100}', 25),
  ('ten-sessions', 'Getting Serious', 'Complete 10 workout sessions', 'milestone', '{"type": "sessions_completed", "count": 10}', 50),
  ('hundred-sessions', 'Centurion', 'Complete 100 workout sessions', 'milestone', '{"type": "sessions_completed", "count": 100}', 500),
  ('first-scan', 'Body Awareness', 'Complete your first posture scan', 'posture', '{"type": "posture_scans", "count": 1}', 10),
  ('ai-conversation', 'Seeking Wisdom', 'Have your first conversation with the AI coach', 'milestone', '{"type": "ai_conversations", "count": 1}', 10)
ON CONFLICT (slug) DO NOTHING;


CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  achievement_id uuid references public.achievements on delete cascade not null,
  
  unlocked_at timestamptz default now(),
  
  -- Context of unlock
  context jsonb, -- e.g., {"session_id": "...", "score": 100}
  
  -- Celebration
  celebrated boolean default false, -- Has user seen the unlock animation?
  
  unique(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements ON public.user_achievements(user_id, unlocked_at desc);


-- ============================================================
-- 24. Activity Feed / Timeline
-- ============================================================

CREATE TABLE IF NOT EXISTS public.activity_feed (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  
  activity_type text check (activity_type in (
    'session_completed',
    'posture_scan',
    'progress_photo',
    'achievement_unlocked',
    'goal_completed',
    'goal_progress',
    'plan_started',
    'plan_completed',
    'milestone',
    'streak'
  )) not null,
  
  title text not null,
  description text,
  
  -- Reference to source
  reference_type text, -- 'exercise_session', 'posture_assessment', etc.
  reference_id uuid,
  
  -- For display
  icon text,
  accent_color text, -- Hex color for this activity type
  
  -- Engagement
  is_highlight boolean default false, -- Featured in summary
  
  created_at timestamptz default now()
);

CREATE INDEX idx_activity_feed ON public.activity_feed(user_id, created_at desc);


-- ============================================================
-- 25. Streak Tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id uuid references auth.users on delete cascade primary key,
  
  current_streak integer default 0,
  longest_streak integer default 0,
  
  last_activity_date date,
  streak_start_date date,
  
  -- Streak protection (e.g., rest days don't break streak)
  rest_days_allowed integer default 1,
  rest_days_used_this_week integer default 0,
  
  updated_at timestamptz default now()
);


-- ============================================================
-- 26. Enable RLS on New Tables
-- ============================================================

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 27. RLS Policies for New Tables
-- ============================================================

-- User Settings
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Progress Photos
CREATE POLICY "Users can view own progress photos" ON public.progress_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress photos" ON public.progress_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own progress photos" ON public.progress_photos FOR DELETE USING (auth.uid() = user_id);

-- Body Measurements
CREATE POLICY "Users can view own measurements" ON public.body_measurements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own measurements" ON public.body_measurements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own measurements" ON public.body_measurements FOR DELETE USING (auth.uid() = user_id);

-- Workout Plans
CREATE POLICY "Users can view own workout plans" ON public.workout_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout plans" ON public.workout_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout plans" ON public.workout_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout plans" ON public.workout_plans FOR DELETE USING (auth.uid() = user_id);

-- Workout Plan Days (via plan ownership)
CREATE POLICY "Users can view own plan days" ON public.workout_plan_days FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.workout_plans WHERE id = plan_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own plan days" ON public.workout_plan_days FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_plans WHERE id = plan_id AND user_id = auth.uid()));

-- Workout Plan Exercises (via plan ownership)
CREATE POLICY "Users can view own plan exercises" ON public.workout_plan_exercises FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.workout_plan_days d 
    JOIN public.workout_plans p ON d.plan_id = p.id 
    WHERE d.id = plan_day_id AND p.user_id = auth.uid()
  ));

-- Scheduled Workouts
CREATE POLICY "Users can view own scheduled workouts" ON public.scheduled_workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scheduled workouts" ON public.scheduled_workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scheduled workouts" ON public.scheduled_workouts FOR UPDATE USING (auth.uid() = user_id);

-- Session Sets (via session ownership)
CREATE POLICY "Users can view own session sets" ON public.session_sets FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.exercise_sessions WHERE id = session_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own session sets" ON public.session_sets FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.exercise_sessions WHERE id = session_id AND user_id = auth.uid()));

-- AI Conversations
CREATE POLICY "Users can view own ai conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai conversations" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ai conversations" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id);

-- AI Messages (via conversation ownership)
CREATE POLICY "Users can view own ai messages" ON public.ai_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own ai messages" ON public.ai_messages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid()));

-- WhatsApp Connections
CREATE POLICY "Users can view own whatsapp connection" ON public.whatsapp_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own whatsapp connection" ON public.whatsapp_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own whatsapp connection" ON public.whatsapp_connections FOR INSERT WITH CHECK (auth.uid() = user_id);

-- WhatsApp Messages
CREATE POLICY "Users can view own whatsapp messages" ON public.whatsapp_messages FOR SELECT USING (auth.uid() = user_id);

-- User Goals
CREATE POLICY "Users can view own goals" ON public.user_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.user_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.user_goals FOR DELETE USING (auth.uid() = user_id);

-- User Achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

-- Activity Feed
CREATE POLICY "Users can view own activity feed" ON public.activity_feed FOR SELECT USING (auth.uid() = user_id);

-- User Streaks
CREATE POLICY "Users can view own streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================
-- 28. Exercises table is PUBLIC (read-only)
-- ============================================================

-- Anyone can read exercises (it's reference data)
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT TO authenticated USING (true);


-- ============================================================
-- 29. Storage Buckets for New Content
-- ============================================================

-- Progress photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own progress photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own progress photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'progress-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own progress photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'progress-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Exercise demos bucket (public, read-only for users)
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-demos', 'exercise-demos', true)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 30. Useful Functions
-- ============================================================

-- Function to calculate current streak
CREATE OR REPLACE FUNCTION public.calculate_user_streak(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  streak integer := 0;
  check_date date := current_date;
  activity_exists boolean;
BEGIN
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.exercise_sessions 
      WHERE user_id = p_user_id 
      AND date(created_at) = check_date
    ) INTO activity_exists;
    
    IF activity_exists THEN
      streak := streak + 1;
      check_date := check_date - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get user's latest posture comparison
CREATE OR REPLACE FUNCTION public.get_posture_comparison(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  latest_assessment record;
  previous_assessment record;
  result jsonb;
BEGIN
  SELECT * INTO latest_assessment
  FROM public.posture_assessments
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  SELECT * INTO previous_assessment
  FROM public.posture_assessments
  WHERE user_id = p_user_id
  AND created_at < latest_assessment.created_at
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF previous_assessment IS NULL THEN
    RETURN jsonb_build_object(
      'latest', row_to_json(latest_assessment),
      'previous', null,
      'score_change', null
    );
  END IF;
  
  RETURN jsonb_build_object(
    'latest', row_to_json(latest_assessment),
    'previous', row_to_json(previous_assessment),
    'score_change', latest_assessment.score - previous_assessment.score
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 31. Triggers for Activity Feed
-- ============================================================

-- Auto-create activity feed entry when session completed
CREATE OR REPLACE FUNCTION public.create_session_activity()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.activity_feed (user_id, activity_type, title, description, reference_type, reference_id)
  VALUES (
    NEW.user_id,
    'session_completed',
    'Workout Completed',
    NEW.exercise_type || ' - ' || COALESCE(NEW.reps, 0) || ' reps, ' || COALESCE(NEW.avg_score, 0) || '% form',
    'exercise_session',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_session_created
  AFTER INSERT ON public.exercise_sessions
  FOR EACH ROW EXECUTE PROCEDURE public.create_session_activity();


-- Auto-create activity feed entry when posture assessment completed
CREATE OR REPLACE FUNCTION public.create_assessment_activity()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.activity_feed (user_id, activity_type, title, description, reference_type, reference_id)
  VALUES (
    NEW.user_id,
    'posture_scan',
    'Posture Scan Completed',
    'Score: ' || COALESCE(NEW.score, 0) || '/100',
    'posture_assessment',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_assessment_created
  AFTER INSERT ON public.posture_assessments
  FOR EACH ROW EXECUTE PROCEDURE public.create_assessment_activity();


-- Auto-create settings when profile is created
CREATE OR REPLACE FUNCTION public.create_user_settings()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.user_streaks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.create_user_settings();


-- ============================================================
-- COMPLETE
-- ============================================================
-- 
-- This schema now supports:
-- ✅ Complete user profiles with onboarding
-- ✅ User settings and preferences
-- ✅ Progress photos with timeline
-- ✅ Body measurements tracking
-- ✅ Expanded posture assessments
-- ✅ Exercise library with coaching cues
-- ✅ Workout plans with days and exercises
-- ✅ Workout scheduling and calendar
-- ✅ Detailed session tracking (sets, reps, form)
-- ✅ AI conversations (in-app)
-- ✅ WhatsApp integration
-- ✅ Goals and milestones
-- ✅ Achievement system
-- ✅ Activity feed / timeline
-- ✅ Streak tracking
-- ✅ All RLS policies
-- ✅ Storage buckets
-- ✅ Utility functions
-- ✅ Auto-triggers for activity feed
--
-- ============================================================
