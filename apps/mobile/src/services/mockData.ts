import { setItem, getItem } from './storage';
import * as userService from './userService';
import * as assessmentService from './assessmentService';
import * as progressService from './progressService';
import * as workoutService from './workoutService';
import * as aiService from './aiService';
import * as achievementService from './achievementService';
import * as activityService from './activityService';
import type {
  UserProfile, PostureAssessment, ProgressPhoto, Exercise, WorkoutPlan,
  WorkoutSession, AIConversation, ActivityFeedItem,
} from '../types/models';

const SEEDED_KEY = 'app:data_seeded';

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

export async function seedDemoData(): Promise<boolean> {
  const seeded = await getItem<boolean>(SEEDED_KEY);
  if (seeded) return false;

  // Read existing profile from onboarding, merge into demo profile
  const existing = await userService.getProfile();
  const profile: UserProfile = {
    id: 'user_1',
    name: existing?.name || 'Neo',
    goals: existing?.goals?.length ? existing.goals : ['build_strength', 'improve_posture'],
    scheduleDays: existing?.scheduleDays?.length ? existing.scheduleDays : ['monday', 'tuesday', 'thursday', 'friday'],
    timePreference: existing?.timePreference || 'morning',
    sessionDuration: existing?.sessionDuration || 60,
    equipment: existing?.equipment?.length ? existing.equipment : ['full_gym', 'dumbbells', 'pull_up_bar'],
    onboardingComplete: true,
    createdAt: daysAgo(42),
    updatedAt: new Date().toISOString(),
  };
  await userService.updateProfile(profile);

  // Streak
  await userService.updateStreak({
    current: 5,
    longest: 12,
    lastActivityDate: new Date().toISOString().split('T')[0],
  });

  // 3 posture assessments over 6 weeks
  const assessments: PostureAssessment[] = [
    {
      id: 'assess_1',
      score: 62,
      landmarks: [],
      issues: [
        { area: 'Shoulders', description: 'Right shoulder elevated ~2cm', severity: 'moderate' },
        { area: 'Hips', description: 'Slight anterior pelvic tilt', severity: 'mild' },
        { area: 'Head', description: 'Forward head posture detected', severity: 'moderate' },
      ],
      aiSummary: 'Initial scan shows moderate upper-cross syndrome pattern. Focus on strengthening mid-back and stretching chest/hip flexors. Recommended: face pulls, wall slides, and hip flexor stretches daily.',
      photoUrls: { front: 'demo_front_1', side: 'demo_side_1' },
      createdAt: daysAgo(42),
    },
    {
      id: 'assess_2',
      score: 70,
      landmarks: [],
      issues: [
        { area: 'Shoulders', description: 'Right shoulder still slightly elevated', severity: 'mild' },
        { area: 'Hips', description: 'Anterior pelvic tilt improving', severity: 'mild' },
      ],
      aiSummary: 'Nice improvement! Shoulder asymmetry decreased and pelvic tilt is less pronounced. Continue your corrective exercise routine. Score improved by 8 points.',
      photoUrls: { front: 'demo_front_2', side: 'demo_side_2' },
      createdAt: daysAgo(21),
    },
    {
      id: 'assess_3',
      score: 78,
      landmarks: [],
      issues: [
        { area: 'Shoulders', description: 'Minor shoulder elevation, within normal range', severity: 'mild' },
      ],
      aiSummary: 'Great progress! Your posture score improved from 62 to 78 over 6 weeks. The anterior pelvic tilt has resolved. Continue maintaining your routine for best results.',
      photoUrls: { front: 'demo_front_3', side: 'demo_side_3', back: 'demo_back_3' },
      createdAt: daysAgo(3),
    },
  ];
  for (const a of assessments) await assessmentService.create(a);

  // 6 progress photos
  const photos: ProgressPhoto[] = [
    { id: 'photo_1', photoUrl: 'demo_front_1', type: 'front', weight: 82, tags: ['week-1'], createdAt: daysAgo(42) },
    { id: 'photo_2', photoUrl: 'demo_side_1', type: 'side', weight: 82, tags: ['week-1'], createdAt: daysAgo(42) },
    { id: 'photo_3', photoUrl: 'demo_front_2', type: 'front', weight: 81, tags: ['week-3'], createdAt: daysAgo(21) },
    { id: 'photo_4', photoUrl: 'demo_side_2', type: 'side', weight: 81, tags: ['week-3'], createdAt: daysAgo(21) },
    { id: 'photo_5', photoUrl: 'demo_front_3', type: 'front', weight: 80, tags: ['week-6'], createdAt: daysAgo(3) },
    { id: 'photo_6', photoUrl: 'demo_side_3', type: 'side', weight: 80, tags: ['week-6'], createdAt: daysAgo(3) },
  ];
  for (const p of photos) await progressService.addPhoto(p);

  // Exercise library (15 exercises)
  const exercises: Exercise[] = [
    { id: 'ex_1', name: 'Barbell Squat', category: 'compound', muscleGroups: ['quads', 'glutes', 'core'], difficulty: 'intermediate', coachingCues: { setup: ['Feet shoulder-width apart', 'Bar on upper traps', 'Chest up, core braced'], execution: ['Break at hips and knees simultaneously', 'Descend until thighs parallel', 'Drive through whole foot'], commonMistakes: ['Knees caving inward', 'Excessive forward lean', 'Rising on toes'] } },
    { id: 'ex_2', name: 'Bench Press', category: 'compound', muscleGroups: ['chest', 'triceps', 'shoulders'], difficulty: 'intermediate', coachingCues: { setup: ['Feet flat on floor', 'Shoulder blades retracted', 'Grip slightly wider than shoulders'], execution: ['Lower bar to mid-chest', 'Touch and press explosively', 'Lock out at top'], commonMistakes: ['Flaring elbows 90 degrees', 'Bouncing off chest', 'Lifting butt off bench'] } },
    { id: 'ex_3', name: 'Deadlift', category: 'compound', muscleGroups: ['back', 'hamstrings', 'glutes', 'core'], difficulty: 'intermediate', coachingCues: { setup: ['Feet hip-width, bar over mid-foot', 'Hinge at hips, grip outside knees', 'Chest up, lats engaged'], execution: ['Push floor away with legs', 'Keep bar close to body', 'Lock hips at top'], commonMistakes: ['Rounding lower back', 'Bar drifting forward', 'Jerking the bar'] } },
    { id: 'ex_4', name: 'Overhead Press', category: 'compound', muscleGroups: ['shoulders', 'triceps', 'core'], difficulty: 'intermediate', coachingCues: { setup: ['Feet shoulder-width', 'Bar at collarbone level', 'Elbows slightly forward'], execution: ['Press straight up past face', 'Push head through at top', 'Full lockout'], commonMistakes: ['Excessive back lean', 'Pressing in front of body', 'Incomplete lockout'] } },
    { id: 'ex_5', name: 'Barbell Row', category: 'compound', muscleGroups: ['back', 'biceps'], difficulty: 'intermediate', coachingCues: { setup: ['Hinge to 45-degree torso', 'Grip just outside knees', 'Core tight, neutral spine'], execution: ['Pull to lower ribcage', 'Squeeze shoulder blades', 'Lower with control'], commonMistakes: ['Using momentum', 'Standing too upright', 'Shrugging shoulders'] } },
    { id: 'ex_6', name: 'Pull-ups', category: 'bodyweight', muscleGroups: ['back', 'biceps'], difficulty: 'intermediate', coachingCues: { setup: ['Hands shoulder-width or wider', 'Dead hang position', 'Engage lats'], execution: ['Pull chest toward bar', 'Drive elbows down and back', 'Full range of motion'], commonMistakes: ['Kipping or swinging', 'Half reps', 'Shrugging at top'] } },
    { id: 'ex_7', name: 'Dumbbell Lunges', category: 'compound', muscleGroups: ['quads', 'glutes', 'hamstrings'], difficulty: 'beginner', coachingCues: { setup: ['Dumbbells at sides', 'Stand tall'], execution: ['Step forward, lower back knee toward ground', 'Front knee tracks over toes', 'Push back to start'], commonMistakes: ['Knee passing toes excessively', 'Leaning forward', 'Short steps'] } },
    { id: 'ex_8', name: 'Face Pulls', category: 'isolation', muscleGroups: ['shoulders', 'back'], difficulty: 'beginner', coachingCues: { setup: ['Cable at face height', 'Rope attachment', 'Overhand grip'], execution: ['Pull toward face, elbows high', 'Externally rotate at end', 'Squeeze rear delts'], commonMistakes: ['Using too much weight', 'Pulling to chest', 'No external rotation'] } },
    { id: 'ex_9', name: 'Romanian Deadlift', category: 'compound', muscleGroups: ['hamstrings', 'glutes', 'back'], difficulty: 'intermediate', coachingCues: { setup: ['Feet hip-width', 'Slight knee bend', 'Barbell or dumbbells'], execution: ['Hinge at hips, push hips back', 'Lower to mid-shin', 'Squeeze glutes to stand'], commonMistakes: ['Rounding back', 'Bending knees too much', 'Going too low'] } },
    { id: 'ex_10', name: 'Dumbbell Lateral Raise', category: 'isolation', muscleGroups: ['shoulders'], difficulty: 'beginner', coachingCues: { setup: ['Light dumbbells at sides', 'Slight forward lean'], execution: ['Raise arms to shoulder height', 'Lead with elbows', 'Control the descent'], commonMistakes: ['Using momentum', 'Going above shoulder height', 'Shrugging'] } },
    { id: 'ex_11', name: 'Plank', category: 'bodyweight', muscleGroups: ['core'], difficulty: 'beginner', coachingCues: { setup: ['Forearms on ground', 'Feet hip-width', 'Body in straight line'], execution: ['Brace core, squeeze glutes', 'Breathe normally', 'Hold position'], commonMistakes: ['Hips sagging', 'Hips piking up', 'Holding breath'] } },
    { id: 'ex_12', name: 'Dumbbell Curl', category: 'isolation', muscleGroups: ['biceps'], difficulty: 'beginner', coachingCues: { setup: ['Stand tall, dumbbells at sides', 'Palms facing forward'], execution: ['Curl weight up, keep elbows pinned', 'Squeeze at top', 'Lower slowly'], commonMistakes: ['Swinging body', 'Moving elbows forward', 'Dropping weight fast'] } },
    { id: 'ex_13', name: 'Tricep Pushdown', category: 'isolation', muscleGroups: ['triceps'], difficulty: 'beginner', coachingCues: { setup: ['Cable high, rope or bar attachment', 'Elbows at sides'], execution: ['Push down until arms straight', 'Squeeze triceps at bottom', 'Control return'], commonMistakes: ['Flaring elbows', 'Leaning over cable', 'Using momentum'] } },
    { id: 'ex_14', name: 'Hip Thrust', category: 'compound', muscleGroups: ['glutes', 'hamstrings'], difficulty: 'intermediate', coachingCues: { setup: ['Upper back on bench', 'Feet flat, knees at 90 degrees', 'Bar across hips'], execution: ['Drive hips up to full extension', 'Squeeze glutes hard at top', 'Lower with control'], commonMistakes: ['Hyperextending lower back', 'Feet too far out', 'Not reaching full extension'] } },
    { id: 'ex_15', name: 'Cable Woodchop', category: 'compound', muscleGroups: ['core'], difficulty: 'beginner', coachingCues: { setup: ['Cable high, rope attachment', 'Stand sideways to machine'], execution: ['Rotate torso diagonally down', 'Arms stay relatively straight', 'Control the return'], commonMistakes: ['Pulling with arms', 'Moving too fast', 'Not engaging core'] } },
  ];
  for (const e of exercises) await workoutService.saveExercise(e);

  // Active workout plan: "Strength Foundation" - 4 days
  const plan: WorkoutPlan = {
    id: 'plan_1',
    name: 'Strength Foundation',
    goal: 'build_strength',
    daysPerWeek: 4,
    isActive: true,
    createdAt: daysAgo(28),
    days: [
      {
        id: 'day_1', dayIndex: 0, name: 'Upper Push', focus: 'Chest, Shoulders, Triceps',
        exercises: [
          { exerciseId: 'ex_2', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 180 },
          { exerciseId: 'ex_4', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'ex_10', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex_13', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
        ],
      },
      {
        id: 'day_2', dayIndex: 1, name: 'Lower', focus: 'Quads, Hamstrings, Glutes',
        exercises: [
          { exerciseId: 'ex_1', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 180 },
          { exerciseId: 'ex_9', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'ex_7', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex_14', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex_15', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 },
        ],
      },
      {
        id: 'day_3', dayIndex: 2, name: 'Upper Pull', focus: 'Back, Biceps, Rear Delts',
        exercises: [
          { exerciseId: 'ex_6', sets: 4, repsMin: 6, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'ex_5', sets: 4, repsMin: 8, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'ex_8', sets: 3, repsMin: 15, repsMax: 20, restSeconds: 60 },
          { exerciseId: 'ex_12', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
        ],
      },
      {
        id: 'day_4', dayIndex: 3, name: 'Full Body', focus: 'Compound Movements',
        exercises: [
          { exerciseId: 'ex_3', sets: 4, repsMin: 5, repsMax: 6, restSeconds: 180 },
          { exerciseId: 'ex_1', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'ex_4', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120 },
          { exerciseId: 'ex_11', sets: 3, repsMin: 30, repsMax: 45, restSeconds: 60, notes: 'seconds hold' },
        ],
      },
    ],
  };
  await workoutService.createPlan(plan);

  // 2 completed sessions
  const sessions: WorkoutSession[] = [
    {
      id: 'sess_1',
      planId: 'plan_1',
      planDayId: 'day_1',
      exercises: [
        { exerciseId: 'ex_2', sets: [{ setNumber: 1, weight: 60, reps: 8, rpe: 7 }, { setNumber: 2, weight: 65, reps: 7, rpe: 8 }, { setNumber: 3, weight: 65, reps: 6, rpe: 8.5 }, { setNumber: 4, weight: 60, reps: 8, rpe: 8 }] },
        { exerciseId: 'ex_4', sets: [{ setNumber: 1, weight: 40, reps: 10, rpe: 7 }, { setNumber: 2, weight: 40, reps: 9, rpe: 8 }, { setNumber: 3, weight: 40, reps: 8, rpe: 8.5 }] },
        { exerciseId: 'ex_10', sets: [{ setNumber: 1, weight: 10, reps: 15, rpe: 7 }, { setNumber: 2, weight: 10, reps: 14, rpe: 8 }, { setNumber: 3, weight: 10, reps: 12, rpe: 8.5 }] },
      ],
      startedAt: daysAgo(7),
      completedAt: daysAgo(7),
      mood: 'good',
    },
    {
      id: 'sess_2',
      planId: 'plan_1',
      planDayId: 'day_2',
      exercises: [
        { exerciseId: 'ex_1', sets: [{ setNumber: 1, weight: 80, reps: 8, rpe: 7 }, { setNumber: 2, weight: 85, reps: 7, rpe: 8 }, { setNumber: 3, weight: 85, reps: 6, rpe: 9 }, { setNumber: 4, weight: 80, reps: 7, rpe: 8 }] },
        { exerciseId: 'ex_9', sets: [{ setNumber: 1, weight: 70, reps: 10, rpe: 7 }, { setNumber: 2, weight: 70, reps: 9, rpe: 8 }, { setNumber: 3, weight: 70, reps: 8, rpe: 8.5 }] },
        { exerciseId: 'ex_7', sets: [{ setNumber: 1, weight: 16, reps: 12, rpe: 7 }, { setNumber: 2, weight: 16, reps: 11, rpe: 8 }, { setNumber: 3, weight: 16, reps: 10, rpe: 8 }] },
      ],
      startedAt: daysAgo(5),
      completedAt: daysAgo(5),
      mood: 'great',
    },
  ];
  for (const s of sessions) await workoutService.startSession(s);

  // AI conversation
  const conversation: AIConversation = {
    id: 'convo_1',
    title: 'BodyOS Coach',
    createdAt: daysAgo(42),
    updatedAt: daysAgo(1),
    messages: [
      { id: 'msg_1', role: 'assistant', content: "Welcome to BodyOS! I'm your AI coach. I can help with workout planning, posture improvement, and form guidance. What would you like to work on?", createdAt: daysAgo(42) },
      { id: 'msg_2', role: 'user', content: 'My posture scan showed forward head posture. What can I do?', createdAt: daysAgo(40) },
      { id: 'msg_3', role: 'assistant', content: "Forward head posture is common, especially if you sit at a desk. Here's a 3-exercise routine:\n\n1. **Chin Tucks** — 3x15 reps, hold 3 sec each\n2. **Wall Angels** — 3x10, slow and controlled\n3. **Thoracic Extensions** — 2x10 over a foam roller\n\nDo these daily, ideally after your warm-up. You should see improvement in 2-4 weeks.", createdAt: daysAgo(40) },
      { id: 'msg_4', role: 'user', content: 'How heavy should I go on bench press?', createdAt: daysAgo(35) },
      { id: 'msg_5', role: 'assistant', content: "For your Strength Foundation plan, bench press is programmed at 4x6-8. Pick a weight where your RPE is 7-8 — meaning you have 2-3 reps left in reserve. Based on your last session at 65kg, try starting at 60kg and working up. Form quality > weight always.", createdAt: daysAgo(35) },
      { id: 'msg_6', role: 'user', content: 'Shoulder feels tight after overhead press', createdAt: daysAgo(10) },
      { id: 'msg_7', role: 'assistant', content: "Tightness after OHP is common. Try this post-session routine:\n\n1. **Cross-body stretch** — 30sec each arm\n2. **Sleeper stretch** — 30sec each side\n3. **Band pull-aparts** — 2x20 as a cool-down\n\nIf the tightness becomes pain or persists beyond 48 hours, consider consulting a physiotherapist. Prevention is key — always warm up with band dislocates before pressing.", createdAt: daysAgo(10) },
      { id: 'msg_8', role: 'user', content: "My latest posture score went up to 78! What should I focus on next?", createdAt: daysAgo(1) },
    ],
  };
  await aiService.createConversation(conversation);

  // Unlock 4 achievements
  await achievementService.unlock('first_scan');
  await achievementService.unlock('first_session');
  await achievementService.unlock('posture_improved');
  await achievementService.unlock('first_photo');

  // Activity feed (15 items)
  const activities: ActivityFeedItem[] = [
    { id: 'act_1', type: 'assessment', title: 'First Body Scan', description: 'Posture score: 62/100', metric: '62', referenceId: 'assess_1', createdAt: daysAgo(42) },
    { id: 'act_2', type: 'achievement', title: 'First Scan Unlocked', description: 'Completed your first posture assessment', createdAt: daysAgo(42) },
    { id: 'act_3', type: 'photo', title: 'Progress Photos', description: 'Added front and side photos', createdAt: daysAgo(42) },
    { id: 'act_4', type: 'plan', title: 'Plan Created', description: 'Started "Strength Foundation" — 4 days/week', referenceId: 'plan_1', createdAt: daysAgo(28) },
    { id: 'act_5', type: 'assessment', title: 'Body Scan', description: 'Posture score: 70/100 (+8)', metric: '70', referenceId: 'assess_2', createdAt: daysAgo(21) },
    { id: 'act_6', type: 'achievement', title: 'Standing Tall', description: 'Posture score improved!', createdAt: daysAgo(21) },
    { id: 'act_7', type: 'photo', title: 'Progress Photos', description: 'Week 3 comparison photos added', createdAt: daysAgo(21) },
    { id: 'act_8', type: 'workout', title: 'Upper Push', description: 'Bench 65kg x 7, OHP 40kg x 10', metric: '45 min', referenceId: 'sess_1', createdAt: daysAgo(7) },
    { id: 'act_9', type: 'achievement', title: 'Iron Starter', description: 'Completed first workout session!', createdAt: daysAgo(7) },
    { id: 'act_10', type: 'workout', title: 'Lower Day', description: 'Squat 85kg x 7, RDL 70kg x 10', metric: '50 min', referenceId: 'sess_2', createdAt: daysAgo(5) },
    { id: 'act_11', type: 'streak', title: '5-Day Streak', description: 'Consistency is building momentum!', metric: '5', createdAt: daysAgo(4) },
    { id: 'act_12', type: 'assessment', title: 'Body Scan', description: 'Posture score: 78/100 (+8)', metric: '78', referenceId: 'assess_3', createdAt: daysAgo(3) },
    { id: 'act_13', type: 'photo', title: 'Progress Photos', description: 'Week 6 comparison photos', createdAt: daysAgo(3) },
    { id: 'act_14', type: 'achievement', title: 'Snapshot', description: 'Took your first progress photo!', createdAt: daysAgo(3) },
    { id: 'act_15', type: 'streak', title: 'Active Today', description: 'Keep the momentum going!', metric: '5', createdAt: daysAgo(0) },
  ];
  for (const a of activities) await activityService.addActivity(a);

  await setItem(SEEDED_KEY, true);
  return true;
}

export async function resetDemoData(): Promise<void> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.clear();
  await seedDemoData();
}
