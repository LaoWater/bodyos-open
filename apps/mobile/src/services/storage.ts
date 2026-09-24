import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getItem<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return null;
  return JSON.parse(raw) as T;
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function getIndex(indexKey: string): Promise<string[]> {
  const raw = await AsyncStorage.getItem(indexKey);
  if (raw === null) return [];
  return JSON.parse(raw) as string[];
}

export async function addToIndex(indexKey: string, id: string): Promise<void> {
  const ids = await getIndex(indexKey);
  if (!ids.includes(id)) {
    ids.push(id);
    await AsyncStorage.setItem(indexKey, JSON.stringify(ids));
  }
}

export async function removeFromIndex(indexKey: string, id: string): Promise<void> {
  const ids = await getIndex(indexKey);
  const filtered = ids.filter((i) => i !== id);
  await AsyncStorage.setItem(indexKey, JSON.stringify(filtered));
}

export async function getCollection<T>(prefix: string, indexKey: string): Promise<T[]> {
  const ids = await getIndex(indexKey);
  const keys = ids.map((id) => `${prefix}:${id}`);
  if (keys.length === 0) return [];
  const pairs = await AsyncStorage.multiGet(keys);
  return pairs
    .filter(([, val]) => val !== null)
    .map(([, val]) => JSON.parse(val!) as T);
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.clear();
}
