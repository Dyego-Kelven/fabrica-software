import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppData, initialData } from './data';

const STORAGE_KEY = '@fabrica-software/dados';

export async function loadData(): Promise<AppData> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) as AppData : initialData;
}

export async function saveData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
