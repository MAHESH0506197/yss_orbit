// yss_orbit\frontend\src\modules\fileStorage\state\fileStorageStore.ts
import { create } from 'zustand';
import { FileStorageSlice, createFileStorageSlice } from './fileStorageSlice';

export const useFileStorageStore = create<FileStorageSlice>((...a) => ({
  ...createFileStorageSlice(...a),
}));
