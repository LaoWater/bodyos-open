import { getItem, setItem, addToIndex, removeFromIndex, getCollection, removeItem } from './storage';
import type { ProgressPhoto, PhotoType } from '../types/models';

const PREFIX = 'photo';
const INDEX = 'photos:index';

export async function addPhoto(photo: ProgressPhoto): Promise<void> {
  await setItem(`${PREFIX}:${photo.id}`, photo);
  await addToIndex(INDEX, photo.id);
}

export async function getPhotos(): Promise<ProgressPhoto[]> {
  const items = await getCollection<ProgressPhoto>(PREFIX, INDEX);
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getPhotosByType(type: PhotoType): Promise<ProgressPhoto[]> {
  const all = await getPhotos();
  return all.filter((p) => p.type === type);
}

export async function deletePhoto(id: string): Promise<void> {
  await removeItem(`${PREFIX}:${id}`);
  await removeFromIndex(INDEX, id);
}
