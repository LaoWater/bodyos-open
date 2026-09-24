import type { CheckpointPhoto, CheckpointPhotoType } from '../types/models';

export interface AnalysisResult {
  landmarks: number[];
  overlayUrl: string;
  score: number;
  issues: { area: string; description: string; severity: string }[];
}

const MOCK_ISSUES: Record<CheckpointPhotoType, { area: string; description: string; severity: string }[]> = {
  anterior: [
    { area: 'shoulders', description: 'Slight elevation on left side', severity: 'mild' },
    { area: 'hips', description: 'Minor lateral tilt detected', severity: 'mild' },
  ],
  posterior: [
    { area: 'upper_back', description: 'Minor thoracic kyphosis detected', severity: 'moderate' },
    { area: 'shoulders', description: 'Scapular winging on right side', severity: 'mild' },
  ],
  lateral_left: [
    { area: 'neck', description: 'Forward head posture', severity: 'mild' },
    { area: 'lower_back', description: 'Mild anterior pelvic tilt', severity: 'moderate' },
  ],
  lateral_right: [
    { area: 'lower_back', description: 'Mild anterior pelvic tilt', severity: 'mild' },
    { area: 'knees', description: 'Slight hyperextension tendency', severity: 'mild' },
  ],
};

/**
 * Simulates a Cloud Run ML analysis call.
 * In production, replace with actual HTTP POST to Cloud Run endpoint.
 */
export async function analyzePhoto(
  photoUrl: string,
  photoType: CheckpointPhotoType,
): Promise<AnalysisResult> {
  // Simulate 2-3s network + processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1000));

  const mockLandmarks = Array.from({ length: 33 }, () => Math.random());
  const score = Math.floor(65 + Math.random() * 30);

  // Pick 1-2 random issues from the type-specific pool
  const pool = MOCK_ISSUES[photoType];
  const numIssues = 1 + Math.floor(Math.random() * pool.length);
  const issues = pool.slice(0, numIssues);

  return {
    landmarks: mockLandmarks,
    overlayUrl: photoUrl, // In production: processed image URL from Cloud Run
    score,
    issues,
  };
}

/**
 * Analyze all photos in a checkpoint sequentially.
 */
export async function analyzeCheckpoint(
  photos: CheckpointPhoto[],
): Promise<Map<string, AnalysisResult>> {
  const results = new Map<string, AnalysisResult>();
  for (const photo of photos) {
    const result = await analyzePhoto(photo.photoUrl, photo.photoType);
    results.set(photo.id, result);
  }
  return results;
}
