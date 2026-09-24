import { useState, useEffect, useCallback } from 'react';
import type { BodyCheckpoint, CheckpointPhoto, CheckpointPhotoType } from '../types/models';
import * as checkpointService from '../services/checkpointService';
import * as bodyAnalysisService from '../services/bodyAnalysisService';

interface CheckpointState {
  checkpoints: BodyCheckpoint[];
  activeCheckpoint: BodyCheckpoint | null;
  loading: boolean;
  analyzing: boolean;
}

export function useCheckpoints() {
  const [state, setState] = useState<CheckpointState>({
    checkpoints: [],
    activeCheckpoint: null,
    loading: true,
    analyzing: false,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const all = await checkpointService.getAllCheckpoints();
    setState({ checkpoints: all, activeCheckpoint: null, loading: false, analyzing: false });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createCheckpoint = useCallback(async (notes?: string): Promise<BodyCheckpoint> => {
    const checkpoint: BodyCheckpoint = {
      id: `cp_${Date.now()}`,
      checkpointDate: new Date().toISOString(),
      status: 'pending',
      notes,
      photos: [],
      createdAt: new Date().toISOString(),
    };
    await checkpointService.createCheckpoint(checkpoint);
    setState((prev) => ({
      ...prev,
      checkpoints: [checkpoint, ...prev.checkpoints],
      activeCheckpoint: checkpoint,
    }));
    return checkpoint;
  }, []);

  const addPhoto = useCallback(async (
    checkpointId: string,
    photoType: CheckpointPhotoType,
    photoUrl: string,
  ): Promise<CheckpointPhoto> => {
    const photo: CheckpointPhoto = {
      id: `cph_${Date.now()}_${photoType}`,
      checkpointId,
      photoType,
      photoUrl,
      processingStatus: 'pending',
      createdAt: new Date().toISOString(),
    };
    const updated = await checkpointService.addPhotoToCheckpoint(checkpointId, photo);
    if (updated) {
      setState((prev) => ({
        ...prev,
        activeCheckpoint: updated,
        checkpoints: prev.checkpoints.map((c) => (c.id === checkpointId ? updated : c)),
      }));
    }
    return photo;
  }, []);

  const submitForAnalysis = useCallback(async (checkpointId: string) => {
    const checkpoint = await checkpointService.getCheckpointById(checkpointId);
    if (!checkpoint || checkpoint.photos.length === 0) return;

    setState((prev) => ({ ...prev, analyzing: true }));

    checkpoint.status = 'processing';
    await checkpointService.updateCheckpoint(checkpoint);
    setState((prev) => ({
      ...prev,
      activeCheckpoint: { ...checkpoint },
      checkpoints: prev.checkpoints.map((c) => (c.id === checkpointId ? { ...checkpoint } : c)),
    }));

    try {
      const results = await bodyAnalysisService.analyzeCheckpoint(checkpoint.photos);

      for (const photo of checkpoint.photos) {
        const result = results.get(photo.id);
        if (result) {
          photo.processingStatus = 'completed';
          photo.overlayUrl = result.overlayUrl;
          photo.rawLandmarks = result.landmarks;
          photo.analysisResults = { score: result.score, issues: result.issues };
          photo.processingCompletedAt = new Date().toISOString();
        }
      }

      checkpoint.status = 'completed';
      await checkpointService.updateCheckpoint(checkpoint);

      setState((prev) => ({
        ...prev,
        analyzing: false,
        activeCheckpoint: { ...checkpoint },
        checkpoints: prev.checkpoints.map((c) => (c.id === checkpointId ? { ...checkpoint } : c)),
      }));
    } catch {
      checkpoint.status = 'failed';
      await checkpointService.updateCheckpoint(checkpoint);
      setState((prev) => ({
        ...prev,
        analyzing: false,
        activeCheckpoint: { ...checkpoint },
        checkpoints: prev.checkpoints.map((c) => (c.id === checkpointId ? { ...checkpoint } : c)),
      }));
    }
  }, []);

  const setActiveCheckpoint = useCallback((cp: BodyCheckpoint | null) => {
    setState((prev) => ({ ...prev, activeCheckpoint: cp }));
  }, []);

  return {
    ...state,
    createCheckpoint,
    addPhoto,
    submitForAnalysis,
    setActiveCheckpoint,
    refresh,
  };
}
