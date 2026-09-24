/**
 * useCoachingAudio — schedules and plays coaching cues with TTS audio.
 *
 * Two modes:
 *   'random'  — Demo mode: fires cues every 6-12s automatically
 *   'manual'  — Analyze mode (future): cues triggered by ML pipeline
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { createAudioPlayer } from 'expo-audio';
import type { CoachingCue, CueCategory } from '../data/coachingCueBank';
import { pickRandomCue, getCuesForExercise } from '../data/coachingCueBank';
import { synthesize, pregenerate } from '../services/elevenLabsTTS';

const MIN_INTERVAL_MS = 5000;
const MAX_INTERVAL_MS = 10000;
const FIRST_CUE_DELAY_MS = 2500; // First cue comes fast to show the feature
const CAPTION_LINGER_MS = 1500;
const RECENT_CUE_LIMIT = 5;

export interface CoachingAudioState {
  currentCue: CoachingCue | null;
  isSpeaking: boolean;
  isPreloading: boolean;
  error: string | null;
  triggerCue: (cue: CoachingCue) => void;
}

interface UseCoachingAudioOptions {
  exerciseId: string;
  enabled: boolean;
  mode: 'random' | 'manual';
}

export function useCoachingAudio({
  exerciseId,
  enabled,
  mode,
}: UseCoachingAudioOptions): CoachingAudioState {
  const [currentCue, setCurrentCue] = useState<CoachingCue | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recentIdsRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const mountedRef = useRef(true);
  const enabledRef = useRef(enabled);

  // Keep ref in sync
  enabledRef.current = enabled;

  // ── Preload cues when exercise changes ──
  useEffect(() => {
    if (!exerciseId) return;

    let cancelled = false;
    setIsPreloading(true);

    const cues = getCuesForExercise(exerciseId);
    const texts = cues.map(c => c.text);

    pregenerate(texts)
      .catch(() => {}) // silent — cues will synthesize on-demand
      .finally(() => {
        if (!cancelled) setIsPreloading(false);
      });

    // Reset recent cues on exercise switch
    recentIdsRef.current = [];

    return () => { cancelled = true; };
  }, [exerciseId]);

  // ── Play a single cue ──
  const playCue = useCallback(async (cue: CoachingCue) => {
    if (!mountedRef.current) return;

    // Synthesize (hits cache if preloaded)
    const uri = await synthesize(cue.text);
    if (!uri || !mountedRef.current || !enabledRef.current) return;

    setCurrentCue(cue);
    setIsSpeaking(true);

    // Track recent
    recentIdsRef.current = [
      ...recentIdsRef.current.slice(-(RECENT_CUE_LIMIT - 1)),
      cue.id,
    ];

    try {
      // Create a fresh player for each cue
      const player = createAudioPlayer(uri);
      playerRef.current = player;

      // Listen for playback finish
      const subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish && mountedRef.current) {
          setIsSpeaking(false);
          subscription.remove();
          player.remove();
          if (playerRef.current === player) playerRef.current = null;

          // Linger the caption, then clear
          lingerTimerRef.current = setTimeout(() => {
            if (mountedRef.current) setCurrentCue(null);
          }, CAPTION_LINGER_MS);
        }
      });

      player.play();
    } catch (err) {
      setIsSpeaking(false);
      setCurrentCue(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  // ── Manual trigger ──
  const triggerCue = useCallback((cue: CoachingCue) => {
    if (!enabled) return;
    playCue(cue);
  }, [enabled, playCue]);

  // ── Random mode scheduling ──
  useEffect(() => {
    if (mode !== 'random' || !enabled) {
      // Clear any pending timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    let isFirst = true;
    function scheduleNext() {
      const delay = isFirst
        ? FIRST_CUE_DELAY_MS
        : MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
      isFirst = false;
      timerRef.current = setTimeout(async () => {
        if (!mountedRef.current || !enabledRef.current) return;

        const cue = pickRandomCue(exerciseId, recentIdsRef.current);
        if (cue) {
          await playCue(cue);
        }

        // Schedule the next cue
        if (mountedRef.current && enabledRef.current) {
          scheduleNext();
        }
      }, delay);
    }

    scheduleNext();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [mode, enabled, exerciseId, playCue]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (lingerTimerRef.current) clearTimeout(lingerTimerRef.current);
      if (playerRef.current) {
        try { playerRef.current.remove(); } catch {}
        playerRef.current = null;
      }
    };
  }, []);

  return { currentCue, isSpeaking, isPreloading, error, triggerCue };
}
