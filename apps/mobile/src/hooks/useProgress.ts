import { useState, useEffect, useCallback } from 'react';
import type { ProgressPhoto, PhotoType } from '../types/models';
import * as progressService from '../services/progressService';

export function useProgress() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await progressService.getPhotos();
    setPhotos(all);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addPhoto = useCallback(async (photo: ProgressPhoto) => {
    await progressService.addPhoto(photo);
    await refresh();
  }, [refresh]);

  const getByType = useCallback((type: PhotoType) => {
    return photos.filter((p) => p.type === type);
  }, [photos]);

  const deletePhoto = useCallback(async (id: string) => {
    await progressService.deletePhoto(id);
    await refresh();
  }, [refresh]);

  return { photos, loading, addPhoto, getByType, deletePhoto, refresh };
}
