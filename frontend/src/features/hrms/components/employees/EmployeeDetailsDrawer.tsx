import { useTranslation } from 'react-i18next';
import React from 'react';
import { createPortal } from 'react-dom';
import { X, User, Briefcase, Phone, MapPin, CreditCard, FileText, Calendar, Building, DollarSign } from 'lucide-react';
import { useEmployee } from '../../api/useEmployees';

import { formatIST } from '@/utils/date';

export const EmployeeDetailsDrawer: React.FC<{ isOpen: boolean; onClose: () => void; employeeId?: string; }> = ({ isOpen, onClose, employeeId }) => {
  const { t } = useTranslation();
  const { data: employee, isLoading } = useEmployee(employeeId || '', { enabled: !!employeeId && isOpen });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="pointer-events-auto w-screen max-w-md transform bg-white shadow-2xl transition-all dark:bg-gray-900 flex flex-col animate-in slide-in-from-right-full duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('auto.employee_profile', 'Employee Profile')}</h2>
            <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
              </div>
            ) : employee ? (
              <>
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  {employee.photo_url ? (
                    <img src={employee.photo_url} alt="Profile" className="h-20 w-20 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold text-2xl">
                      {employee.first_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{employee.first_name} {employee.last_name}</h3>
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{employee.designation_name || 'No Designation'}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
                      <Briefcase className="h-3 w-3" /> {employee.employee_code}
                    </p>
                    <p className="mt-2 text-xs">
                      {employee.user_id ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <User className="h-3 w-3" /> {t('auto.linked_to_iam_user', 'Linked to IAM User (')}{employee.linked_user_name || 'Active'})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400">
                          <User className="h-3 w-3" /> {t('auto.no_linked_user', 'No Linked User')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Section: Personal Information */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-4">
                    <User className="h-4 w-4 text-blue-500" /> {t('auto.personal_information', 'Personal Information')}
                  </h4>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                    <div>
                      <span className="block text-xs text-gray-500 mb-0.5">{t('auto.gender', 'Gender')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">{employee.gender === 'M' ? 'Male' : employee.gender === 'F' ? 'Female' : employee.gender || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 mb-0.5">{t('auto.date_of_birth', 'Date of Birth')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">
                        {employee.date_of_birth ? formatIST(employee.date_of_birth, 'MMM d, yyyy') : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 mb-0.5">{t('auto.marital_status', 'Marital Status')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">{employee.marital_status || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 mb-0.5">{t('auto.blood_group', 'Blood Group')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">{employee.blood_group || '-'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-xs text-gray-500 mb-0.5">{t('auto.nationality', 'Nationality')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">{employee.nationality || 'Indian'}</span>
                    </div>
                  </div>
                </div>

                {/* Section: Employment */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-4">
                    <Building className="h-4 w-4 text-indigo-500" /> {t('auto.employment', 'Employment')}
                  </h4>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                    <div>
                      <span className="block text-xs text-gray-500 mb-0.5">{t('auto.department', 'Department')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">{employee.department_name || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 mb-0.5">{t('auto.type', 'Type')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">{employee.employment_type?.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 mb-0.5">{t('auto.status', 'Status')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">{employee.employment_status?.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 mb-0.5">{t('auto.joining_date', 'Joining Date')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">
                        {employee.date_of_joining ? formatIST(employee.date_of_joining, 'MMM d, yyyy') : '-'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-xs text-gray-500 mb-0.5">{t('auto.manager', 'Manager')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">{employee.reporting_manager_id || 'Not Assigned'}</span>
                    </div>
                  </div>
                </div>

                {/* Section: Contact */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-4">
                    <Phone className="h-4 w-4 text-emerald-500" /> {t('auto.contact_details', 'Contact Details')}
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">{t('auto.official_email', 'Official Email')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">{employee.work_email || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">{t('auto.personal_email', 'Personal Email')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">{employee.personal_email || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">{t('auto.mobile_phone', 'Mobile Phone')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">{employee.phone || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Section: Compliance */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-4">
                    <FileText className="h-4 w-4 text-purple-500" /> {t('auto.compliance_details', 'Compliance Details')}
                  </h4>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                    <div>
                      <span className="block text-xs text-gray-500 mb-0.5">{t('auto.pan_number', 'PAN Number')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200 font-mono">{employee.pan_number || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 mb-0.5">{t('auto.aadhaar', 'Aadhaar')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200 font-mono">{employee.aadhaar_number || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 mb-0.5">{t('auto.passport_no', 'Passport No.')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200 font-mono">{employee.passport_number || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 mb-0.5">{t('auto.pf_number', 'PF Number')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200 font-mono">{employee.pf_number || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Section: Banking */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-4">
                    <CreditCard className="h-4 w-4 text-amber-500" /> {t('auto.banking_information', 'Banking Information')}
                  </h4>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                    <div className="col-span-2">
                      <span className="block text-xs text-gray-500 mb-0.5">{t('auto.bank_name', 'Bank Name')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200">{employee.bank_name || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 mb-0.5">{t('auto.account_no', 'Account No.')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200 font-mono">
                        {employee.bank_account_number ? '••••' + employee.bank_account_number.slice(-4) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 mb-0.5">{t('auto.ifsc', 'IFSC')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200 font-mono">{employee.bank_ifsc || '-'}</span>
                    </div>
                  </div>
                </div>

              </>
            ) : (
              <div className="text-center py-20 text-gray-500">{t('auto.employee_not_found', 'Employee not found.')}</div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
