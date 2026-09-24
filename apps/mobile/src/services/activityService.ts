import { setItem, addToIndex, getCollection } from './storage';
import type { ActivityFeedItem } from '../types/models';

const PREFIX = 'activity';
const INDEX = 'activities:index';

export async function getFeed(limit?: number): Promise<ActivityFeedItem[]> {
  const items = await getCollection<ActivityFeedItem>(PREFIX, INDEX);
  const sorted = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function addActivity(item: ActivityFeedItem): Promise<void> {
  await setItem(`${PREFIX}:${item.id}`, item);
  await addToIndex(INDEX, item.id);
}
