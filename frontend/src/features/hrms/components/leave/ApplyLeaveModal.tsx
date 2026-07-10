import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Calendar as CalendarIcon, FileUp } from 'lucide-react';
import { useApplyLeave } from '../../api/useLeave';
import { LeaveRequest } from '../../types/leaveTypes';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveTypes: any[];
}

export const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({ isOpen, onClose, leaveTypes }) => {
  const { t } = useTranslation();
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<Partial<LeaveRequest>>({
    defaultValues: {
      session: 'FULL_DAY'
    }
  });
  
  const applyLeaveMutation = useApplyLeave();
  const userId = useAuthStore(state => state.userId);
  const selectedType = watch('leave_type');
  const typeConfig = leaveTypes.find(t => t.id === selectedType);

  const onSubmit = async (data: Partial<LeaveRequest>) => {
    if (!userId) return;
    try {
      await applyLeaveMutation.mutateAsync({ ...data, employee: userId });
      toast.success('Leave request submitted successfully');
      reset();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.error?.details || e.response?.data?.error?.message || 'Failed to submit leave request');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{t('auto.apply_leave', 'Apply Leave')}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auto.leave_type', 'Leave Type')}</label>
            <select {...register('leave_type', { required: 'Leave type is required' })} className="w-full h-11 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
              <option value="">{t('auto.select_leave_type', 'Select leave type')}</option>
              {leaveTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.leave_type && <p className="mt-1 text-sm text-red-500">{errors.leave_type.message as string}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auto.start_date', 'Start Date')}</label>
              <input type="date" {...register('start_date', { required: 'Start date is required' })} className="w-full h-11 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auto.end_date', 'End Date')}</label>
              <input type="date" {...register('end_date', { required: 'End date is required' })} className="w-full h-11 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
          </div>
          
          {typeConfig?.allow_half_day && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auto.session', 'Session')}</label>
              <select {...register('session')} className="w-full h-11 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                <option value="FULL_DAY">{t('auto.full_day', 'Full Day')}</option>
                <option value="FIRST_HALF">{t('auto.first_half_morning', 'First Half (Morning)')}</option>
                <option value="SECOND_HALF">{t('auto.second_half_afternoon', 'Second Half (Afternoon)')}</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auto.reason', 'Reason')}</label>
            <textarea {...register('reason', { required: 'Reason is required' })} rows={3} placeholder={t('auto.please_provide_a_brief_reason', 'Please provide a brief reason...')} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"></textarea>
            {errors.reason && <p className="mt-1 text-sm text-red-500">{errors.reason.message as string}</p>}
          </div>

          {typeConfig?.requires_attachment && (
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
              <FileUp className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-800">{t('auto.attachment_required', 'Attachment Required')}</p>
                <p className="text-xs text-orange-600 mt-1">{t('auto.this_leave_type_requires_a_supporting_document_e_g', 'This leave type requires a supporting document (e.g., Medical Certificate) if it exceeds')} {typeConfig.attachment_after_days} {t('auto.days', 'days.')}</p>
                <input type="file" className="mt-3 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 transition-colors cursor-pointer" />
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">{t('auto.cancel', 'Cancel')}</button>
            <button type="submit" disabled={applyLeaveMutation.isPending} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {applyLeaveMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
