import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { AlertTriangle } from 'lucide-react';

interface HardDeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entityName: string;
  entityType: 'Role' | 'Role Template' | 'Module' | 'Sub-Module';
  isLoading?: boolean;
}

export function HardDeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  entityName,
  entityType,
  isLoading
}: HardDeleteConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  
  const isMatch = confirmText === entityName;

  const handleConfirm = () => {
    if (isMatch && !isLoading) {
      onConfirm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Permanent Deletion Warning">
      <div className="space-y-6">
        <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-semibold text-red-900 dark:text-red-400">
              This action cannot be undone.
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300">
              You are about to permanently delete the {entityType} <strong>"{entityName}"</strong>. 
              This will completely wipe it from the database, bypassing the soft-delete audit trail. 
              Any users currently assigned to this role may lose access immediately.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Please type <strong>{entityName}</strong> to confirm.
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder={entityName}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isMatch || isLoading}
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors ${
              isMatch && !isLoading
                ? 'bg-red-600 hover:bg-red-700 shadow-sm'
                : 'bg-red-400 cursor-not-allowed opacity-70'
            }`}
          >
            {isLoading ? 'Deleting...' : 'Permanent Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
