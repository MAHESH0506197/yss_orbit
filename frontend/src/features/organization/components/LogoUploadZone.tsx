import React, { useRef, useState, useEffect } from 'react';
import { Upload, Trash2, Loader2, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUploadOrganizationLogo } from '../hooks/useOrganizations';

export function LogoUploadZone({
  orgId, currentLogoUrl, onUploaded, onFileSelected,
}: {
  orgId?: string;
  currentLogoUrl: string | null;
  onUploaded: (url: string) => void;
  onFileSelected: (file: File | null) => void;
}) {
  const inputRef       = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadOrganizationLogo();
  const [preview, setPreview]     = useState<string | null>(currentLogoUrl);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => { setPreview(currentLogoUrl); }, [currentLogoUrl]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error('Image must be under 5 MB.'); return; }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    onFileSelected(file);
  };

  const handleRemove = () => {
    setPreview(null); onUploaded(''); onFileSelected(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (preview) {
    return (
      <div className="group relative h-20 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
        <img src={preview} alt="Logo preview" className="h-full w-full object-contain p-2" />
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-all backdrop-blur-sm group-hover:opacity-100">
          <button type="button" onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-bold text-gray-800 hover:bg-white">
            <Upload className="h-3 w-3" /> Change
          </button>
          <button type="button" onClick={handleRemove}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/90 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-600">
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        </div>
        {uploadMutation.isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className={`flex h-20 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed text-xs font-medium transition-all hover:scale-[1.01] ${
          isDragging
            ? 'border-violet-500 bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400'
            : 'border-gray-200 bg-gray-50/50 text-gray-400 hover:border-violet-300 hover:bg-violet-50 hover:text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600 dark:text-gray-500'
        }`}
      >
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${isDragging ? 'bg-violet-100 dark:bg-violet-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
          <ImagePlus className="h-4 w-4" />
        </div>
        <span>Click or drag to upload logo</span>
        <span className="text-[10px] opacity-50">PNG, JPG, WebP · max 5 MB</span>
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}
