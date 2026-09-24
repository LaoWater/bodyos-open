import { getItem, setItem, addToIndex, getCollection } from './storage';
import type { PostureAssessment } from '../types/models';

const PREFIX = 'assessment';
const INDEX = 'assessments:index';

export async function create(assessment: PostureAssessment): Promise<void> {
  await setItem(`${PREFIX}:${assessment.id}`, assessment);
  await addToIndex(INDEX, assessment.id);
}

export async function getById(id: string): Promise<PostureAssessment | null> {
  return getItem<PostureAssessment>(`${PREFIX}:${id}`);
}

export async function getAll(): Promise<PostureAssessment[]> {
  const items = await getCollection<PostureAssessment>(PREFIX, INDEX);
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getLatest(): Promise<PostureAssessment | null> {
  const all = await getAll();
  return all.length > 0 ? all[0] : null;
}

export async function getComparison(id1: string, id2: string): Promise<{ before: PostureAssessment; after: PostureAssessment } | null> {
  const [a, b] = await Promise.all([getById(id1), getById(id2)]);
  if (!a || !b) return null;
  const sorted = [a, b].sort((x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime());
  return { before: sorted[0], after: sorted[1] };
}
