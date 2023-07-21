import { FolderInterface } from '@/types/folder';
import { AppStorage } from './storage';

export const saveFolders = (folders: FolderInterface[]) => {
  AppStorage.setItem('folders', JSON.stringify(folders));
};
