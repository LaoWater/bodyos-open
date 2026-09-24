import { getItem, setItem, addToIndex, removeFromIndex, getCollection, removeItem } from './storage';
import type { BodyCheckpoint, CheckpointPhoto } from '../types/models';

const PREFIX = 'checkpoint';
const INDEX = 'checkpoints:index';

export async function createCheckpoint(checkpoint: BodyCheckpoint): Promise<void> {
  await setItem(`${PREFIX}:${checkpoint.id}`, checkpoint);
  await addToIndex(INDEX, checkpoint.id);
}

export async function getCheckpointById(id: string): Promise<BodyCheckpoint | null> {
  return getItem<BodyCheckpoint>(`${PREFIX}:${id}`);
}

export async function getAllCheckpoints(): Promise<BodyCheckpoint[]> {
  const items = await getCollection<BodyCheckpoint>(PREFIX, INDEX);
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateCheckpoint(checkpoint: BodyCheckpoint): Promise<void> {
  await setItem(`${PREFIX}:${checkpoint.id}`, checkpoint);
}

export async function deleteCheckpoint(id: string): Promise<void> {
  await removeItem(`${PREFIX}:${id}`);
  await removeFromIndex(INDEX, id);
}

export async function addPhotoToCheckpoint(
  checkpointId: string,
  photo: CheckpointPhoto,
): Promise<BodyCheckpoint | null> {
  const checkpoint = await getCheckpointById(checkpointId);
  if (!checkpoint) return null;
  // Replace existing photo of same type, or add new
  const existingIdx = checkpoint.photos.findIndex((p) => p.photoType === photo.photoType);
  if (existingIdx >= 0) {
    checkpoint.photos[existingIdx] = photo;
  } else {
    checkpoint.photos.push(photo);
  }
  await setItem(`${PREFIX}:${checkpointId}`, checkpoint);
  return checkpoint;
}

export async function updatePhotoInCheckpoint(
  checkpointId: string,
  photo: CheckpointPhoto,
): Promise<BodyCheckpoint | null> {
  const checkpoint = await getCheckpointById(checkpointId);
  if (!checkpoint) return null;
  const idx = checkpoint.photos.findIndex((p) => p.id === photo.id);
  if (idx >= 0) checkpoint.photos[idx] = photo;
  await setItem(`${PREFIX}:${checkpointId}`, checkpoint);
  return checkpoint;
}
