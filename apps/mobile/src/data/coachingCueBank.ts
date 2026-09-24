/**
 * Coaching cue bank — curated phrases for each exercise.
 *
 * Categories map to visual styling in CoachingCaption:
 *   form         → tealCyan gradient, body icon
 *   breathing    → bluePurple gradient, leaf icon
 *   mind-muscle  → warmSunset gradient, flash icon
 *   encouragement → coralPink gradient, heart icon
 */

export type CueCategory = 'form' | 'breathing' | 'mind-muscle' | 'encouragement';

export interface CoachingCue {
  id: string;
  text: string;
  category: CueCategory;
  exerciseId: string;
}

// ─── Cue definitions ──────────────────────────────────────────────────────────

const CUES: CoachingCue[] = [
  // ── Squat ──
  { id: 'sq-1', text: 'Push your knees out over your toes', category: 'form', exerciseId: 'squat' },
  { id: 'sq-2', text: 'Engage your glutes and core', category: 'mind-muscle', exerciseId: 'squat' },
  { id: 'sq-3', text: 'Drive through your heels', category: 'form', exerciseId: 'squat' },
  { id: 'sq-4', text: 'Exhale tension through the nose', category: 'breathing', exerciseId: 'squat' },
  { id: 'sq-5', text: 'Push into your legs, feel the ground', category: 'mind-muscle', exerciseId: 'squat' },
  { id: 'sq-6', text: 'Great depth, keep it up', category: 'encouragement', exerciseId: 'squat' },

  // ── Lunge ──
  { id: 'lu-1', text: 'Keep your front knee tracking over your ankle', category: 'form', exerciseId: 'lunge' },
  { id: 'lu-2', text: 'Lower your back knee toward the ground', category: 'form', exerciseId: 'lunge' },
  { id: 'lu-3', text: 'Create ground hand torque tension', category: 'mind-muscle', exerciseId: 'lunge' },
  { id: 'lu-4', text: 'Inhale on the way down, exhale on the way up', category: 'breathing', exerciseId: 'lunge' },
  { id: 'lu-5', text: 'Squeeze your glute at the top', category: 'mind-muscle', exerciseId: 'lunge' },
  { id: 'lu-6', text: 'Beautiful balance, stay focused', category: 'encouragement', exerciseId: 'lunge' },

  // ── Push-Up ──
  { id: 'pu-1', text: 'Keep your core tight, no hip sag', category: 'form', exerciseId: 'pushup' },
  { id: 'pu-2', text: 'Spread your fingers wide, grip the ground', category: 'mind-muscle', exerciseId: 'pushup' },
  { id: 'pu-3', text: 'Exhale as you push up', category: 'breathing', exerciseId: 'pushup' },
  { id: 'pu-4', text: 'Tuck your elbows at forty-five degrees', category: 'form', exerciseId: 'pushup' },
  { id: 'pu-5', text: 'Strong form, keep going', category: 'encouragement', exerciseId: 'pushup' },

  // ── Plank ──
  { id: 'pl-1', text: 'Draw your belly button toward your spine', category: 'mind-muscle', exerciseId: 'plank' },
  { id: 'pl-2', text: 'Keep your hips level, don\'t let them sag', category: 'form', exerciseId: 'plank' },
  { id: 'pl-3', text: 'Breathe steadily, slow exhales through the nose', category: 'breathing', exerciseId: 'plank' },
  { id: 'pl-4', text: 'Stack your shoulders over your elbows', category: 'form', exerciseId: 'plank' },
  { id: 'pl-5', text: 'You\'re solid, hold it steady', category: 'encouragement', exerciseId: 'plank' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cuesByExercise = new Map<string, CoachingCue[]>();
for (const cue of CUES) {
  const list = cuesByExercise.get(cue.exerciseId) ?? [];
  list.push(cue);
  cuesByExercise.set(cue.exerciseId, list);
}

/** Get all cues for an exercise (for preloading). */
export function getCuesForExercise(exerciseId: string): CoachingCue[] {
  return cuesByExercise.get(exerciseId) ?? [];
}

/** Pick a random cue, avoiding recently used IDs. */
export function pickRandomCue(
  exerciseId: string,
  recentIds: string[] = [],
): CoachingCue | null {
  const pool = getCuesForExercise(exerciseId);
  if (pool.length === 0) return null;

  // Filter out recent cues
  const available = pool.filter(c => !recentIds.includes(c.id));
  // If all were recent, allow any
  const candidates = available.length > 0 ? available : pool;

  return candidates[Math.floor(Math.random() * candidates.length)];
}
