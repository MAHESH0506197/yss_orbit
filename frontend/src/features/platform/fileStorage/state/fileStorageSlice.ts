// yss_orbit\frontend\src\modules\fileStorage\state\fileStorageSlice.ts
import { StateCreator } from 'zustand';
import { StoredFile } from '../types/fileStorageTypes';

export interface FileStorageSlice {
  files: StoredFile[];
  setFiles: (files: StoredFile[]) => void;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
}

export const createFileStorageSlice: StateCreator<FileStorageSlice> = (set) => ({
  files: [],
  setFiles: (files) => set({ files }),
  isUploading: false,
  setIsUploading: (isUploading) => set({ isUploading }),
});
