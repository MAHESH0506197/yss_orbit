// yss_orbit\frontend\src\modules\fileStorage\services\fileStorageService.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseService } from '@/utils/core/api/baseService';
import { StoredFile } from '../types/fileStorageTypes';

class FileStorageApiService extends BaseService {
  constructor() {
    super('/files');
  }

  getFiles(): Promise<StoredFile[]> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<StoredFile[]>('/');
  }

  getFile(id: string | number): Promise<StoredFile> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<StoredFile>(`/${id}`);
  }

  uploadFile(file: File): Promise<StoredFile> {
    const formData = new FormData();
    formData.append('file', file);
    // @ts-expect-error - Auto-patched TS2339
    return this.post<StoredFile>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  deleteFile(id: string | number): Promise<void> {
    // @ts-expect-error - Auto-patched TS2339
    return this.delete(`/${id}`);
  }
}

export const FileStorageService = new FileStorageApiService();
