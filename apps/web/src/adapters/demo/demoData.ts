import type {
  UserProfile,
  BodyCheckpoint,
  WorkoutSession,
  WorkoutPlan,
  Conversation,
  ActivityFeedItem,
  Achievement,
} from '@/types/models';

// ─── User Profile ───────────────────────────────────────────
export const demoProfile: UserProfile = {
  id: 'demo-user-001',
  name: 'Alex Chen',
  email: 'alex@bodyos.demo',
  avatar_url: undefined,
  streak: 12,
  goals: ['strength', 'body_performance', 'recovery'],
  biometrics: { age: 29, height: 178, weight: 76, gender: 'male' },
  painPoints: ['lower_back', 'right_shoulder'],
  movementPhilosophy: ['functional_training', 'mind_body', 'progressive_overload'],
  schedule: { days: ['monday', 'wednesday', 'friday', 'saturday'], timeOfDay: 'morning', duration: '60min' },
  equipment: ['barbell', 'dumbbells', 'pull_up_bar', 'resistance_bands'],
  units: 'metric',
  createdAt: '2025-11-15T08:00:00Z',
};

// ─── Body Checkpoints ───────────────────────────────────────
export const demoCheckpoints: BodyCheckpoint[] = [
  {
    id: 'cp-001',
    userId: 'demo-user-001',
    date: '2026-02-10T09:30:00Z',
    score: 78,
    status: 'completed',
    photos: [
      { id: 'p1', angle: 'anterior', url: '/media/bodyos-blueprints-vertical.jpeg', score: 80 },
      { id: 'p2', angle: 'posterior', url: '/media/bodyos-blueprints-vertical.jpeg', score: 74 },
      { id: 'p3', angle: 'lateral_left', url: '/media/bodyos-blueprints-vertical.jpeg', score: 79 },
      { id: 'p4', angle: 'lateral_right', url: '/media/bodyos-blueprints-vertical.jpeg', score: 77 },
    ],
    focusAreas: [
      {
        id: 'fa-001',
        name: 'Right Shoulder Elevation',
        description: 'Your right shoulder sits approximately 2cm higher than the left, suggesting upper trapezius tension or lateral chain imbalance.',
        severity: 'medium',
        landmarkIndices: [11, 12],
      },
      {
        id: 'fa-002',
        name: 'Anterior Pelvic Tilt',
        description: 'Moderate anterior pelvic tilt observed. This can affect hip flexor length and lumbar loading during deadlifts and squats.',
        severity: 'low',
        landmarkIndices: [23, 24],
      },
    ],
    aiSummary:
      'Overall solid structural alignment with two areas to monitor. The right shoulder elevation is likely related to your reported right shoulder pain — incorporating targeted thoracic spine mobility and serratus anterior activation before upper body sessions would help. The anterior pelvic tilt is mild and within normal range but worth addressing with hip flexor stretching and glute activation work.',
  },
  {
    id: 'cp-002',
    userId: 'demo-user-001',
    date: '2026-01-15T10:00:00Z',
    score: 72,
    status: 'completed',
    photos: [
      { id: 'p5', angle: 'anterior', url: '/media/bodyos-blueprints-vertical.jpeg', score: 73 },
      { id: 'p6', angle: 'posterior', url: '/media/bodyos-blueprints-vertical.jpeg', score: 70 },
      { id: 'p7', angle: 'lateral_left', url: '/media/bodyos-blueprints-vertical.jpeg', score: 74 },
      { id: 'p8', angle: 'lateral_right', url: '/media/bodyos-blueprints-vertical.jpeg', score: 71 },
    ],
    focusAreas: [
      {
        id: 'fa-003',
        name: 'Right Shoulder Elevation',
        description: 'Right shoulder noticeably elevated. Consider upper trap release work.',
        severity: 'high',
        landmarkIndices: [11, 12],
      },
      {
        id: 'fa-004',
        name: 'Forward Head Position',
        description: 'Head sits slightly forward of the plumb line. Strengthening deep neck flexors would help.',
        severity: 'medium',
        landmarkIndices: [0, 7, 8],
      },
      {
        id: 'fa-005',
        name: 'Anterior Pelvic Tilt',
        description: 'Moderate anterior tilt affecting lumbar curve.',
        severity: 'medium',
        landmarkIndices: [23, 24],
      },
    ],
    aiSummary:
      'Three focus areas identified. The shoulder elevation has improved since the last checkpoint but remains a priority. Forward head position is a new finding — likely related to desk work posture. Recommend chin tuck exercises and pec minor stretching.',
  },
];

// ─── Workout Sessions ───────────────────────────────────────
export const demoSessions: WorkoutSession[] = [
  {
    id: 'sess-001',
    userId: 'demo-user-001',
    exercise: 'Push-Up',
    date: '2026-02-11T07:30:00Z',
    duration: '4:32',
    videoUrl: '/media/demo-videos/pushup_heavy_overlay.mov',
    thumbnailUrl: '/media/bodyos-blueprints-landscape.jpeg',
    formScore: 87,
    reps: 15,
    avgTempo: '2-0-2-0',
    feedback: [
      { id: 'fb1', type: 'positive', message: 'Excellent core stability throughout the set' },
      { id: 'fb2', type: 'positive', message: 'Consistent depth on each rep' },
      { id: 'fb3', type: 'improvement', message: 'Slight elbow flare on reps 12-15 — focus on tucking elbows at 45 degrees' },
    ],
  },
  {
    id: 'sess-002',
    userId: 'demo-user-001',
    exercise: 'Lunge',
    date: '2026-02-09T08:15:00Z',
    duration: '6:18',
    videoUrl: '/media/demo-videos/lunge_heavy_overlay.mov',
    thumbnailUrl: '/media/bodyos-blueprints-landscape.jpeg',
    formScore: 74,
    reps: 20,
    avgTempo: '2-1-2-0',
    feedback: [
      { id: 'fb4', type: 'positive', message: 'Good step length and knee tracking on left leg' },
      { id: 'fb5', type: 'improvement', message: 'Right knee tends to drift inward — engage glute medius before the descent' },
      { id: 'fb6', type: 'improvement', message: 'Torso leans forward past 20 degrees on later reps — brace core harder' },
    ],
  },
  {
    id: 'sess-003',
    userId: 'demo-user-001',
    exercise: 'Squat',
    date: '2026-02-07T07:00:00Z',
    duration: '5:45',
    formScore: 82,
    reps: 12,
    avgTempo: '3-1-2-0',
    feedback: [
      { id: 'fb7', type: 'positive', message: 'Consistent depth below parallel' },
      { id: 'fb8', type: 'positive', message: 'Smooth eccentric control throughout' },
      { id: 'fb9', type: 'improvement', message: 'Slight heel rise at the bottom — work on ankle mobility' },
    ],
  },
];

// ─── Workout Plans ──────────────────────────────────────────
export const demoWorkoutPlans: WorkoutPlan[] = [
  {
    id: 'plan-001',
    name: 'Foundation Strength',
    goal: 'Build balanced strength with movement quality focus',
    daysPerWeek: 4,
    isActive: true,
    days: [
      {
        id: 'day-001',
        name: 'Upper Push',
        muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
        exercises: [
          { id: 'ex-001', exerciseId: 'bench-press', name: 'Bench Press', sets: 4, repsRange: '6-8', restSeconds: 120, coachingCues: 'Retract scapulae. Drive feet into floor. Control the eccentric for 3 seconds.' },
          { id: 'ex-002', exerciseId: 'ohp', name: 'Overhead Press', sets: 3, repsRange: '8-10', restSeconds: 90, coachingCues: 'Brace core. Stack wrists over elbows. Full lockout at top.' },
          { id: 'ex-003', exerciseId: 'dips', name: 'Dips', sets: 3, repsRange: '8-12', restSeconds: 90, coachingCues: 'Lean slightly forward for chest emphasis. Control the descent.' },
          { id: 'ex-004', exerciseId: 'lat-raise', name: 'Lateral Raise', sets: 3, repsRange: '12-15', restSeconds: 60, coachingCues: 'Lead with the elbows. Pause at the top briefly.' },
        ],
      },
      {
        id: 'day-002',
        name: 'Lower Body',
        muscleGroups: ['Quads', 'Hamstrings', 'Glutes'],
        exercises: [
          { id: 'ex-005', exerciseId: 'squat', name: 'Barbell Squat', sets: 4, repsRange: '5-6', restSeconds: 180, coachingCues: 'Break at hips and knees simultaneously. Knees track over toes. Drive through whole foot.' },
          { id: 'ex-006', exerciseId: 'rdl', name: 'Romanian Deadlift', sets: 3, repsRange: '8-10', restSeconds: 120, coachingCues: 'Hinge at hips. Keep bar close to legs. Feel the hamstring stretch.' },
          { id: 'ex-007', exerciseId: 'lunge', name: 'Walking Lunge', sets: 3, repsRange: '10-12 each', restSeconds: 90, coachingCues: 'Long step. Front knee at 90 degrees. Upright torso.' },
          { id: 'ex-008', exerciseId: 'leg-curl', name: 'Nordic Curl (Assisted)', sets: 3, repsRange: '5-8', restSeconds: 90, coachingCues: 'Control the eccentric. Use hands to assist the concentric if needed.' },
        ],
      },
      {
        id: 'day-003',
        name: 'Upper Pull',
        muscleGroups: ['Back', 'Biceps', 'Rear Delts'],
        exercises: [
          { id: 'ex-009', exerciseId: 'pullup', name: 'Pull-Up', sets: 4, repsRange: '6-8', restSeconds: 120, coachingCues: 'Dead hang start. Lead with chest to bar. Full extension at bottom.' },
          { id: 'ex-010', exerciseId: 'row', name: 'Barbell Row', sets: 3, repsRange: '8-10', restSeconds: 90, coachingCues: 'Hinge to 45 degrees. Pull to lower chest. Squeeze shoulder blades.' },
          { id: 'ex-011', exerciseId: 'face-pull', name: 'Face Pull', sets: 3, repsRange: '15-20', restSeconds: 60, coachingCues: 'External rotate at the end position. Squeeze rear delts.' },
          { id: 'ex-012', exerciseId: 'curl', name: 'Incline Dumbbell Curl', sets: 3, repsRange: '10-12', restSeconds: 60, coachingCues: 'Keep elbows behind the torso. Full stretch at the bottom.' },
        ],
      },
      {
        id: 'day-004',
        name: 'Movement & Core',
        muscleGroups: ['Core', 'Mobility', 'Stability'],
        exercises: [
          { id: 'ex-013', exerciseId: 'deadbug', name: 'Dead Bug', sets: 3, repsRange: '8 each side', restSeconds: 60, coachingCues: 'Press lower back into floor. Move opposite arm and leg. Breathe out on extension.' },
          { id: 'ex-014', exerciseId: 'pallof', name: 'Pallof Press', sets: 3, repsRange: '10 each side', restSeconds: 60, coachingCues: 'Resist rotation. Press straight out from sternum. Brace core.' },
          { id: 'ex-015', exerciseId: 'goblet-squat', name: 'Goblet Squat (Pause)', sets: 3, repsRange: '8-10', restSeconds: 90, coachingCues: '3 second pause at bottom. Use the elbows to push knees out.' },
          { id: 'ex-016', exerciseId: 'carry', name: 'Farmer\'s Carry', sets: 3, repsRange: '40m', restSeconds: 90, coachingCues: 'Tall posture. Shoulders packed. Quiet feet.' },
        ],
      },
    ],
  },
];

// ─── Conversations ──────────────────────────────────────────
export const demoConversations: Conversation[] = [
  {
    id: 'conv-001',
    userId: 'demo-user-001',
    title: 'Shoulder mobility plan',
    lastMessage: 'Try wall slides before your push sessions...',
    updatedAt: '2026-02-11T14:30:00Z',
    messages: [
      {
        id: 'msg-001',
        role: 'user',
        content: 'My right shoulder has been feeling tight during overhead press. What can I do?',
        timestamp: '2026-02-11T14:25:00Z',
      },
      {
        id: 'msg-002',
        role: 'assistant',
        content:
          'Based on your latest checkpoint, your right shoulder sits about 2cm higher than the left — this suggests upper trapezius tension that can restrict overhead movement.\n\nHere\'s what I\'d recommend before your push sessions:\n\n1. **Thoracic spine foam roll** — 2 minutes, focusing on the upper back\n2. **Wall slides** — 3 sets of 10, keeping your wrists and elbows against the wall\n3. **Band pull-aparts** — 2 sets of 15, focusing on squeezing the shoulder blades\n4. **Serratus anterior activation** — wall push-up plus (protract at the top)\n\nThis sequence addresses both the mobility restriction and the muscle activation pattern. Your shoulder elevation has actually improved from your January checkpoint — the work you\'re doing is paying off.',
        timestamp: '2026-02-11T14:26:00Z',
      },
      {
        id: 'msg-003',
        role: 'user',
        content: 'How long before I should see improvement?',
        timestamp: '2026-02-11T14:28:00Z',
      },
      {
        id: 'msg-004',
        role: 'assistant',
        content:
          'With consistent work (3-4x per week before upper body sessions), you should notice a difference in 2-3 weeks. Your January-to-February checkpoint comparison already shows improvement in shoulder symmetry, so you\'re on the right track.\n\nI\'d suggest scheduling your next body checkpoint in about 3 weeks so we can measure the change objectively. In the meantime, pay attention to how the overhead press feels — subjective improvements often come before measurable structural changes.',
        timestamp: '2026-02-11T14:30:00Z',
      },
    ],
  },
  {
    id: 'conv-002',
    userId: 'demo-user-001',
    title: 'Squat depth feedback',
    lastMessage: 'Your ankle mobility is the key factor here...',
    updatedAt: '2026-02-08T16:10:00Z',
    messages: [
      {
        id: 'msg-005',
        role: 'user',
        content: 'I noticed my heels rise when I squat deep. What should I work on?',
        timestamp: '2026-02-08T16:05:00Z',
      },
      {
        id: 'msg-006',
        role: 'assistant',
        content:
          'Your session data from Feb 7 confirms this — the pose analysis flagged a slight heel rise at the bottom position.\n\nYour ankle dorsiflexion is the key factor here. This is a common pattern, especially in athletes with your training background. Here are three approaches, from immediate to long-term:\n\n**Immediate (use today):**\n- Elevate heels 1-2cm using small plates under your heels\n\n**Short-term (daily, 5 minutes):**\n- Wall ankle mobilization — knee to wall, 3x30sec each side\n- Banded ankle distraction — band pulls talus backward while you drive knee forward\n\n**Long-term (2-3x/week):**\n- Deep squat holds with support — accumulate 2 minutes total in a deep squat position\n- Calf eccentrics on a step — 3x12, slow 4-second lowering\n\nThe heel elevation is totally fine to use while you build ankle range. Many elite lifters squat in heeled shoes permanently. It\'s about finding the right solution for your body.',
        timestamp: '2026-02-08T16:10:00Z',
      },
    ],
  },
];

// ─── Activity Feed ──────────────────────────────────────────
export const demoActivityFeed: ActivityFeedItem[] = [
  { id: 'act-001', type: 'workout', title: 'Upper Push', subtitle: 'Completed with mood: energized', timestamp: '2026-02-11T08:30:00Z' },
  { id: 'act-002', type: 'checkpoint', title: 'Body Checkpoint', subtitle: 'Score: 78/100 — 2 focus areas', timestamp: '2026-02-10T09:30:00Z' },
  { id: 'act-003', type: 'streak', title: '12 Day Streak', subtitle: 'Your longest streak yet', timestamp: '2026-02-10T08:00:00Z' },
  { id: 'act-004', type: 'workout', title: 'Lower Body', subtitle: 'Completed with mood: tough', timestamp: '2026-02-09T08:15:00Z' },
  { id: 'act-005', type: 'achievement', title: 'Form Master', subtitle: 'Scored 85+ on 3 consecutive sessions', badge: 'form_master', timestamp: '2026-02-08T07:45:00Z' },
  { id: 'act-006', type: 'workout', title: 'Upper Pull', subtitle: 'Completed with mood: great', timestamp: '2026-02-07T07:00:00Z' },
  { id: 'act-007', type: 'workout', title: 'Movement & Core', subtitle: 'Completed with mood: focused', timestamp: '2026-02-05T07:30:00Z' },
];

// ─── Achievements ───────────────────────────────────────────
export const demoAchievements: Achievement[] = [
  { id: 'ach-001', title: 'First Steps', description: 'Complete your first workout', icon: 'footprints', unlocked: true, unlockedDate: '2025-11-15T08:30:00Z' },
  { id: 'ach-002', title: 'Body Aware', description: 'Complete your first body checkpoint', icon: 'scan', unlocked: true, unlockedDate: '2025-11-20T09:00:00Z' },
  { id: 'ach-003', title: 'Consistency', description: 'Maintain a 7-day streak', icon: 'flame', unlocked: true, unlockedDate: '2026-01-28T08:00:00Z' },
  { id: 'ach-004', title: 'Form Master', description: 'Score 85+ on 3 consecutive sessions', icon: 'target', unlocked: true, unlockedDate: '2026-02-08T07:45:00Z' },
  { id: 'ach-005', title: 'Iron Will', description: 'Maintain a 30-day streak', icon: 'shield', unlocked: false },
  { id: 'ach-006', title: 'Scholar', description: 'Have 10 coaching conversations', icon: 'book-open', unlocked: false },
  { id: 'ach-007', title: 'Transformer', description: 'Improve your body score by 15+ points', icon: 'trending-up', unlocked: false },
  { id: 'ach-008', title: 'Centurion', description: 'Complete 100 workout sessions', icon: 'crown', unlocked: false },
  { id: 'ach-009', title: 'Perfect Form', description: 'Score 95+ on any session', icon: 'star', unlocked: false },
  { id: 'ach-010', title: 'Movement Scientist', description: 'Analyze 50 sessions with pose detection', icon: 'microscope', unlocked: false },
];
