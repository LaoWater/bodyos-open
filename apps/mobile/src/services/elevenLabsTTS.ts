/**
 * ElevenLabs TTS service — synthesize speech and cache MP3s to disk.
 *
 * Uses the standard REST endpoint (non-streaming) with eleven_flash_v2_5
 * for low latency. Caches by sanitized text filename to avoid redundant API calls.
 *
 * Voice: Adam — deep, natural, authoritative coaching tone.
 * Timeout: 5s AbortController to prevent UI jank on slow network.
 */

import { File, Directory, Paths } from 'expo-file-system';

// ─── Config ───────────────────────────────────────────────────────────────────

// Disabled for distribution: secret provider credentials must live behind a server proxy.
const API_KEY: string = '';
const VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam — deep, natural, authoritative coaching voice
const MODEL_ID = 'eleven_flash_v2_5';
const OUTPUT_FORMAT = 'mp3_44100_128';
const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=${OUTPUT_FORMAT}`;

const CACHE_DIR_NAME = 'tts-cache-v2'; // v2: Adam voice (was Antoni in v1)
const FETCH_TIMEOUT_MS = 5000;

const VOICE_SETTINGS = {
  stability: 0.50,        // lower = more natural variation
  similarity_boost: 0.85, // high fidelity to voice character
  style: 0.30,            // slight expressiveness
  use_speaker_boost: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sanitize text into a safe filename. */
function textToFilename(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80) + '.mp3';
}

function getCacheDir(): Directory {
  return new Directory(Paths.cache, CACHE_DIR_NAME);
}

function ensureCacheDir(): void {
  const dir = getCacheDir();
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

function getCacheFile(filename: string): File {
  return new File(getCacheDir(), filename);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Synthesize text to speech. Returns a local file URI for playback.
 * Uses disk cache — subsequent calls for the same text are instant.
 * Has a 5s timeout to prevent blocking the UI on slow networks.
 */
export async function synthesize(text: string): Promise<string | null> {
  if (!API_KEY) {
    console.warn('[ElevenLabs] No API key configured');
    return null;
  }

  try {
    ensureCacheDir();
    const filename = textToFilename(text);
    const file = getCacheFile(filename);

    // Check cache first (instant return)
    if (file.exists) {
      return file.uri;
    }

    // Call API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: VOICE_SETTINGS,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[ElevenLabs] API error ${response.status}: ${response.statusText}`);
      return null;
    }

    // Get response as bytes and write to file
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    file.create({ intermediates: true });
    file.write(bytes);

    return file.uri;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[ElevenLabs] Synthesis timed out');
    } else {
      console.warn('[ElevenLabs] Synthesis failed:', error);
    }
    return null;
  }
}

/**
 * Pre-generate and cache audio for a list of texts.
 * Fire-and-forget: runs in background with concurrency limit.
 * Errors are silently caught — cues will synthesize on-demand as fallback.
 */
export async function pregenerate(texts: string[]): Promise<void> {
  ensureCacheDir();

  // Check which texts are not yet cached
  const uncached: string[] = [];
  for (const text of texts) {
    const filename = textToFilename(text);
    const file = getCacheFile(filename);
    if (!file.exists) {
      uncached.push(text);
    }
  }

  if (uncached.length === 0) return;

  // Synthesize up to 3 at a time
  const CONCURRENCY = 3;
  for (let i = 0; i < uncached.length; i += CONCURRENCY) {
    const batch = uncached.slice(i, i + CONCURRENCY);
    await Promise.allSettled(batch.map(t => synthesize(t)));
  }
}

/** Clear the TTS disk cache. */
export function clearCache(): void {
  try {
    const dir = getCacheDir();
    if (dir.exists) {
      dir.delete();
    }
  } catch (error) {
    console.warn('[ElevenLabs] Cache clear failed:', error);
  }
}
