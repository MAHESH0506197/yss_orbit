import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { getCroppedImg } from '@/utils/cropImage';
import toast from 'react-hot-toast';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onApply: (croppedFile: File) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({ isOpen, onClose, imageSrc, onApply }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      if (croppedBlob) {
        // Convert Blob to File
        const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
        onApply(file);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to crop image.');
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crop Profile Picture"
      description="Adjust your image to perfectly fit the circular avatar."
      className="max-w-md"
    >
      <div className="flex flex-col space-y-4">
        {imageSrc ? (
          <div className="relative h-64 w-full bg-black rounded-md overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
        ) : null}

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Zoom
          </label>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => {
              setZoom(Number(e.target.value));
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={isProcessing || !imageSrc}>
            {isProcessing ? 'Applying...' : 'Apply Crop'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
