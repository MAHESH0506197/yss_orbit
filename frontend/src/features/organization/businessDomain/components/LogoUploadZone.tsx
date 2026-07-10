import React, { useRef, useState } from 'react';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';

export interface LoopUploadZoneProps {
  currentLogoUrl: string | null | undefined;
  onFileSelected: (f: File | null) => void;
  onUploaded: (url: string) => void;
  isUploading: boolean;
  pendingFile: File | null;
}

export function LogoUploadZone({ currentLogoUrl, onFileSelected, onUploaded, isUploading, pendingFile }: LoopUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (pendingFile) {
      const url = URL.createObjectURL(pendingFile);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setObjectUrl(null);
      return undefined;
    }
  }, [pendingFile]);

  const preview = objectUrl || currentLogoUrl || null;

  const handleFile = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'].includes(file.type)) {
      toast.error('Unsupported format. Use JPG, PNG, WebP, GIF, or SVG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large — max 5 MB.');
      return;
    }
    onFileSelected(file);
    onUploaded('');  // clear stored URL so preview uses blob
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      className={`relative flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-6 transition-all cursor-pointer select-none ${
        dragOver
          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-inner'
          : 'border-gray-200 dark:border-gray-700 hover:border-violet-400 hover:bg-gray-50/50 dark:hover:border-violet-600 dark:hover:bg-gray-800/30'
      }`}
      onClick={() => inputRef.current?.click()}
      role="button"
      aria-label="Upload domain logo"
    >
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Logo preview"
            className="h-20 w-20 rounded-2xl object-contain border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md" />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onFileSelected(null); onUploaded(''); }}
            aria-label="Remove logo"
            className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600 transition shadow-sm ring-2 ring-white dark:ring-gray-900"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <ImagePlus className="h-7 w-7" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Drop image or click to browse</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">JPG, PNG, WebP, GIF, SVG — max 5 MB</p>
          </div>
        </div>
      )}
      {pendingFile && (
        <div className="flex items-center gap-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 px-3 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300 ring-1 ring-violet-200 dark:ring-violet-800">
          <Upload className="h-3 w-3" /> {pendingFile.name} — will upload on save
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}
