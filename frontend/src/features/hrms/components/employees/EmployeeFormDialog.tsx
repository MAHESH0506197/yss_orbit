import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  X, Save, AlertCircle, Loader2, ImagePlus, Upload, Trash2, 
  ChevronRight, ChevronLeft, CheckCircle2, User, Briefcase, 
  Phone, ShieldCheck, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Employee, EmployeeFormValues, employeeSchema } from '../../types/employeeTypes';
import { useEmployeeMutations } from '../../api/useEmployeeMutations';
import { useBusinessDomains } from '@/features/organization/businessDomain/api/useBusinessDomains';
import { useDepartments, useDesignations, useCreateDepartment, useCreateDesignation } from '../../api/useOrgStructure';
import { useAuthStore } from '@/store/authStore';
import { Plus } from 'lucide-react';

const STEPS = [
  { id: 'personal', title: 'Personal Info', icon: User },
  { id: 'employment', title: 'Employment', icon: Briefcase },
  { id: 'contact', title: 'Contact', icon: Phone },
  { id: 'compliance', title: 'Compliance', icon: ShieldCheck },
  { id: 'banking', title: 'Banking', icon: Building2 },
  { id: 'review', title: 'Review & Submit', icon: CheckCircle2 },
];

function FieldError({ message }: { message?: string }) {
  const { t } = useTranslation();
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-500">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

function inputCls(hasError: boolean) {
  return [
    'fm-input w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all',
    'placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-gray-500',
    hasError
      ? 'border-rose-400 bg-rose-50/30 dark:border-rose-700/50 dark:bg-rose-900/10'
      : 'border-gray-200 bg-white hover:border-gray-300 focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:focus:border-indigo-500',
  ].join(' ');
}

function Field({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode; }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
        {label}{required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}

// ─── Logo Upload Zone ─────────────────────────────────────────────────────────
function PhotoUploadZone({ currentPhotoUrl, onFileSelected }: { currentPhotoUrl: string | null; onFileSelected: (file: File | null) => void; }) {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(currentPhotoUrl);

  React.useEffect(() => { setPreview(currentPhotoUrl); }, [currentPhotoUrl]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    onFileSelected(file);
  };

  const handleRemove = () => {
    setPreview(null); onFileSelected(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-6">
      <div className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
        {preview ? (
          <img src={preview} alt="Employee preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-800">
            <User className="h-8 w-8" />
          </div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 transition-all backdrop-blur-sm group-hover:opacity-100">
          <button type="button" onClick={() => inputRef.current?.click()} className="text-[10px] font-bold text-white hover:underline">{t('auto.change', 'Change')}</button>
          {preview && <button type="button" onClick={handleRemove} className="text-[10px] font-bold text-rose-400 hover:underline">{t('auto.remove', 'Remove')}</button>}
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('auto.profile_photo', 'Profile Photo')}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('auto.upload_a_professional_headshot_max_5mb_jpg_png', 'Upload a professional headshot. Max 5MB (JPG, PNG).')}</p>
      </div>
    </div>
  );
}

export const EmployeeFormDialog: React.FC<{ isOpen: boolean; onClose: () => void; employee?: Employee | null; }> = ({ isOpen, onClose, employee }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [isAddingDesig, setIsAddingDesig] = useState(false);
  const [newDesigName, setNewDesigName] = useState('');
  
  const { createEmployee, updateEmployee, uploadPhoto, isCreating, isUpdating, isUploadingPhoto } = useEmployeeMutations();
  const { data: departmentsResponse, isLoading: isLoadingDepartments } = useDepartments();
  const { data: designationsResponse, isLoading: isLoadingDesignations } = useDesignations();
  const createDeptMutation = useCreateDepartment();
  const createDesigMutation = useCreateDesignation();
  const { userId, hasPermission } = useAuthStore();
  const isEditing = !!employee;
  const isBusy = isCreating || isUpdating || isUploadingPhoto;
  const isSelfService = isEditing && employee?.user_id === userId && !hasPermission('hrms.employees.edit');

  const { register, handleSubmit, reset, setValue, watch, trigger, formState: { errors } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employee_code: '', first_name: '', last_name: '', middle_name: '', gender: '', date_of_birth: '', marital_status: '', blood_group: '',
      department: null, designation: null, reporting_manager_id: null, employment_type: 'FULL_TIME', employment_status: 'ACTIVE',
      date_of_joining: new Date().toISOString().split('T')[0], probation_end_date: '', confirmation_date: '', ctc: 0, basic_salary: 0,
      personal_email: '', work_email: '', phone: '', emergency_contact_name: '', emergency_contact_phone: '', current_address: '', permanent_address: '',
      aadhaar_number: '', pan_number: '', passport_number: '', pf_number: '', esi_number: '',
      bank_name: '', bank_account_number: '', bank_ifsc: '', photo_url: null,
    },
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setPhotoFile(null);
      if (employee) {
        reset({
          employee_code: employee.employee_code, first_name: employee.first_name, last_name: employee.last_name, middle_name: employee.middle_name || '', gender: employee.gender || '', date_of_birth: employee.date_of_birth || '', marital_status: employee.marital_status || '', blood_group: employee.blood_group || '',
          department: employee.department || null, designation: employee.designation || null, reporting_manager_id: employee.reporting_manager_id || null, employment_type: employee.employment_type || 'FULL_TIME', employment_status: employee.employment_status || 'ACTIVE',
          date_of_joining: employee.date_of_joining || '', probation_end_date: employee.probation_end_date || '', confirmation_date: employee.confirmation_date || '', ctc: employee.ctc || 0, basic_salary: employee.basic_salary || 0,
          personal_email: employee.personal_email || '', work_email: employee.work_email || '', phone: employee.phone || '', emergency_contact_name: employee.emergency_contact_name || '', emergency_contact_phone: employee.emergency_contact_phone || '', current_address: employee.current_address || '', permanent_address: employee.permanent_address || '',
          aadhaar_number: employee.aadhaar_number || '', pan_number: employee.pan_number || '', passport_number: employee.passport_number || '', pf_number: employee.pf_number || '', esi_number: employee.esi_number || '',
          bank_name: employee.bank_name || '', bank_account_number: employee.bank_account_number || '', bank_ifsc: employee.bank_ifsc || '', photo_url: employee.photo_url || null,
        });
      } else {
        reset({
          employee_code: '', first_name: '', last_name: '', middle_name: '', gender: '', date_of_birth: '', marital_status: '', blood_group: '',
          department: null, designation: null, reporting_manager_id: null, employment_type: 'FULL_TIME', employment_status: 'ACTIVE',
          date_of_joining: new Date().toISOString().split('T')[0], probation_end_date: '', confirmation_date: '', ctc: 0, basic_salary: 0,
          personal_email: '', work_email: '', phone: '', emergency_contact_name: '', emergency_contact_phone: '', current_address: '', permanent_address: '',
          aadhaar_number: '', pan_number: '', passport_number: '', pf_number: '', esi_number: '',
          bank_name: '', bank_account_number: '', bank_ifsc: '', photo_url: null,
        });
      }
    }
  }, [isOpen, employee, reset]);

  const stepFields = [
    ['first_name', 'last_name', 'employee_code'], // Step 1
    ['date_of_joining'], // Step 2
    [], // Step 3
    [], // Step 4
    [], // Step 5
    [], // Step 6
  ];

  const handleNext = async () => {
    const fieldsToValidate = stepFields[currentStep] as any;
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const onSubmit = async (data: EmployeeFormValues) => {
    try {
      let employeeId = employee?.id;
      if (isEditing && employee) {
        await updateEmployee({ id: employee.id, payload: data });
        toast.success('Employee updated successfully');
      } else {
        const result = await createEmployee(data);
        employeeId = result.id;
        toast.success('Employee created successfully');
      }
      
      if (photoFile && employeeId) {
        await uploadPhoto({ id: employeeId, file: photoFile });
      }

      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleCreateDept = async () => {
    if (!newDeptName.trim()) return;
    try {
      const res = await createDeptMutation.mutateAsync({ name: newDeptName.trim() });
      setValue('department', res.id, { shouldValidate: true });
      setIsAddingDept(false);
      setNewDeptName('');
      toast.success('Department added');
    } catch (e: any) {
      const msg = e.response?.data?.error?.details || 'Failed to create department';
      toast.error(typeof msg === 'string' ? msg : 'Failed to create department');
    }
  };

  const handleCreateDesig = async () => {
    if (!newDesigName.trim()) return;
    try {
      const res = await createDesigMutation.mutateAsync({ 
        name: newDesigName.trim(), 
        department: watch('department') || undefined 
      });
      setValue('designation', res.id, { shouldValidate: true });
      setIsAddingDesig(false);
      setNewDesigName('');
      toast.success('Designation added');
    } catch (e: any) {
      const msg = e.response?.data?.error?.details || 'Failed to create designation';
      toast.error(typeof msg === 'string' ? msg : 'Failed to create designation');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={!isBusy ? onClose : undefined} />
      
      <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Employee' : 'New Employee'}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isEditing ? `Updating records for ${employee?.first_name} ${employee?.last_name}` : 'Create a new employee profile in the HRMS.'}
            </p>
          </div>
          <button onClick={onClose} disabled={isBusy} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper Header */}
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {STEPS.map((step, idx) => {
                const isCurrent = currentStep === idx;
                const isCompleted = currentStep > idx;
                const StepIcon = step.icon;
                return (
                  <li key={step.id} className="relative flex flex-col items-center gap-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      isCompleted ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500' :
                      isCurrent ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400' :
                      'border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
                    }`}>
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <span className={`text-xs font-semibold ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {step.title}
                    </span>
                    {/* Connector line */}
                    {idx < STEPS.length - 1 && (
                      <div className={`absolute top-5 left-1/2 -z-10 w-full h-[2px] ${isCompleted ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-gray-200 dark:bg-gray-800'}`} style={{ width: 'calc(100% + 2rem)' }} />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form id="employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* STEP 1: Personal */}
            {currentStep === 0 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <PhotoUploadZone currentPhotoUrl={employee?.photo_url || null} onFileSelected={setPhotoFile} />
                
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label={t('auto.employee_code', 'Employee Code')} error={errors.employee_code?.message} hint="Leave empty to auto-generate (if configured)">
                    <input {...register('employee_code')} disabled={isSelfService} className={inputCls(!!errors.employee_code)} placeholder={t('auto.emp_001', 'EMP-001')} />
                  </Field>
                  <Field label={t('auto.first_name', 'First Name')} required error={errors.first_name?.message}>
                    <input {...register('first_name')} disabled={isSelfService} className={inputCls(!!errors.first_name)} placeholder={t('auto.john', 'John')} />
                  </Field>
                  <Field label={t('auto.middle_name', 'Middle Name')} error={errors.middle_name?.message}>
                    <input {...register('middle_name')} disabled={isSelfService} className={inputCls(!!errors.middle_name)} placeholder={t('auto.h', 'H.')} />
                  </Field>
                  <Field label={t('auto.last_name', 'Last Name')} required error={errors.last_name?.message}>
                    <input {...register('last_name')} disabled={isSelfService} className={inputCls(!!errors.last_name)} placeholder={t('auto.doe', 'Doe')} />
                  </Field>
                  <Field label={t('auto.gender', 'Gender')} error={errors.gender?.message}>
                    <select {...register('gender')} disabled={isSelfService} className={inputCls(!!errors.gender)}>
                      <option value="">{t('auto.select_gender', 'Select Gender')}</option>
                      <option value="M">{t('auto.male', 'Male')}</option>
                      <option value="F">{t('auto.female', 'Female')}</option>
                      <option value="O">{t('auto.other', 'Other')}</option>
                    </select>
                  </Field>
                  <Field label={t('auto.date_of_birth', 'Date of Birth')} error={errors.date_of_birth?.message}>
                    <input type="date" {...register('date_of_birth')} disabled={isSelfService} className={inputCls(!!errors.date_of_birth)} />
                  </Field>
                  <Field label={t('auto.marital_status', 'Marital Status')} error={errors.marital_status?.message}>
                    <select {...register('marital_status')} disabled={isSelfService} className={inputCls(!!errors.marital_status)}>
                      <option value="">{t('auto.select_status', 'Select Status')}</option>
                      <option value="SINGLE">{t('auto.single', 'Single')}</option>
                      <option value="MARRIED">{t('auto.married', 'Married')}</option>
                      <option value="DIVORCED">{t('auto.divorced', 'Divorced')}</option>
                      <option value="WIDOWED">{t('auto.widowed', 'Widowed')}</option>
                    </select>
                  </Field>
                  <Field label={t('auto.blood_group', 'Blood Group')} error={errors.blood_group?.message}>
                    <input {...register('blood_group')} disabled={isSelfService} className={inputCls(!!errors.blood_group)} placeholder={t('auto.o', 'O+')} />
                  </Field>
                </div>
              </div>
            )}

            {/* STEP 2: Employment */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label={t('auto.department', 'Department')} error={errors.department?.message}>
                    {isAddingDept ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          className={inputCls(false)}
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          placeholder={t('auto.new_department', 'New Department')}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateDept(); } }}
                        />
                        <button type="button" onClick={handleCreateDept} disabled={createDeptMutation.isPending} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">{t('auto.save', 'Save')}</button>
                        <button type="button" onClick={() => setIsAddingDept(false)} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200">{t('auto.cancel', 'Cancel')}</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select {...register('department')} disabled={isSelfService || isLoadingDepartments} className={inputCls(!!errors.department)}>
                          <option value="">{t('auto.select_department', 'Select Department')}</option>
                          {departmentsResponse?.data?.map((dept: any) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </select>
                        {!isSelfService && (
                          <button type="button" onClick={() => setIsAddingDept(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700" title={t('auto.add_department', 'Add Department')}>
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </Field>
                  <Field label={t('auto.designation', 'Designation')} error={errors.designation?.message}>
                    {isAddingDesig ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          className={inputCls(false)}
                          value={newDesigName}
                          onChange={(e) => setNewDesigName(e.target.value)}
                          placeholder={t('auto.new_designation', 'New Designation')}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateDesig(); } }}
                        />
                        <button type="button" onClick={handleCreateDesig} disabled={createDesigMutation.isPending} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">{t('auto.save', 'Save')}</button>
                        <button type="button" onClick={() => setIsAddingDesig(false)} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200">{t('auto.cancel', 'Cancel')}</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select {...register('designation')} disabled={isSelfService || isLoadingDesignations} className={inputCls(!!errors.designation)}>
                          <option value="">{t('auto.select_designation', 'Select Designation')}</option>
                          {designationsResponse?.data?.map((desig: any) => (
                            <option key={desig.id} value={desig.id}>{desig.name}</option>
                          ))}
                        </select>
                        {!isSelfService && (
                          <button type="button" onClick={() => setIsAddingDesig(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700" title={t('auto.add_designation', 'Add Designation')}>
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </Field>
                  <Field label={t('auto.employment_type', 'Employment Type')} error={errors.employment_type?.message}>
                    <select {...register('employment_type')} disabled={isSelfService} className={inputCls(!!errors.employment_type)}>
                      <option value="FULL_TIME">{t('auto.full_time', 'Full Time')}</option>
                      <option value="PART_TIME">{t('auto.part_time', 'Part Time')}</option>
                      <option value="CONTRACT">{t('auto.contract', 'Contract')}</option>
                      <option value="INTERN">{t('auto.intern', 'Intern')}</option>
                      <option value="CONSULTANT">{t('auto.consultant', 'Consultant')}</option>
                    </select>
                  </Field>
                  <Field label={t('auto.status', 'Status')} error={errors.employment_status?.message}>
                    <select {...register('employment_status')} disabled={isSelfService} className={inputCls(!!errors.employment_status)}>
                      <option value="ACTIVE">{t('auto.active', 'Active')}</option>
                      <option value="ON_LEAVE">{t('auto.on_leave', 'On Leave')}</option>
                      <option value="NOTICE_PERIOD">{t('auto.notice_period', 'Notice Period')}</option>
                      <option value="TERMINATED">{t('auto.terminated', 'Terminated')}</option>
                      <option value="RESIGNED">{t('auto.resigned', 'Resigned')}</option>
                      <option value="RETIRED">{t('auto.retired', 'Retired')}</option>
                    </select>
                  </Field>
                  <Field label={t('auto.date_of_joining', 'Date of Joining')} required error={errors.date_of_joining?.message}>
                    <input type="date" {...register('date_of_joining')} disabled={isSelfService} className={inputCls(!!errors.date_of_joining)} />
                  </Field>
                  <Field label={t('auto.probation_end_date', 'Probation End Date')} error={errors.probation_end_date?.message}>
                    <input type="date" {...register('probation_end_date')} disabled={isSelfService} className={inputCls(!!errors.probation_end_date)} />
                  </Field>
                  <Field label={t('auto.confirmation_date', 'Confirmation Date')} error={errors.confirmation_date?.message}>
                    <input type="date" {...register('confirmation_date')} disabled={isSelfService} className={inputCls(!!errors.confirmation_date)} />
                  </Field>
                  <Field label={t('auto.annual_ctc', 'Annual CTC')} error={errors.ctc?.message}>
                    <input type="number" {...register('ctc', { valueAsNumber: true })} disabled={isSelfService} className={inputCls(!!errors.ctc)} placeholder="0.00" />
                  </Field>
                </div>
              </div>
            )}

            {/* STEP 3: Contact */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label={t('auto.official_email', 'Official Email')} error={errors.work_email?.message}>
                    <input type="email" {...register('work_email')} className={inputCls(!!errors.work_email)} placeholder={t('auto.john_company_com', 'john@company.com')} />
                  </Field>
                  <Field label={t('auto.personal_email', 'Personal Email')} error={errors.personal_email?.message}>
                    <input type="email" {...register('personal_email')} className={inputCls(!!errors.personal_email)} placeholder={t('auto.john_gmail_com', 'john@gmail.com')} />
                  </Field>
                  <Field label={t('auto.mobile_number', 'Mobile Number')} error={errors.phone?.message}>
                    <input {...register('phone')} className={inputCls(!!errors.phone)} placeholder="+91 9876543210" />
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-5">
                  <Field label={t('auto.current_address', 'Current Address')} error={errors.current_address?.message}>
                    <textarea {...register('current_address')} className={inputCls(!!errors.current_address)} rows={2} />
                  </Field>
                  <Field label={t('auto.permanent_address', 'Permanent Address')} error={errors.permanent_address?.message}>
                    <textarea {...register('permanent_address')} className={inputCls(!!errors.permanent_address)} rows={2} />
                  </Field>
                </div>
              </div>
            )}

            {/* STEP 4: Compliance */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label={t('auto.aadhaar_number', 'Aadhaar Number')} error={errors.aadhaar_number?.message}>
                    <input {...register('aadhaar_number')} disabled={isSelfService} className={inputCls(!!errors.aadhaar_number)} placeholder="1234 5678 9012" />
                  </Field>
                  <Field label={t('auto.pan_number', 'PAN Number')} error={errors.pan_number?.message}>
                    <input {...register('pan_number')} disabled={isSelfService} className={inputCls(!!errors.pan_number)} placeholder={t('auto.abcde1234f', 'ABCDE1234F')} />
                  </Field>
                  <Field label={t('auto.passport_number', 'Passport Number')} error={errors.passport_number?.message}>
                    <input {...register('passport_number')} disabled={isSelfService} className={inputCls(!!errors.passport_number)} />
                  </Field>
                  <Field label={t('auto.pf_number', 'PF Number')} error={errors.pf_number?.message}>
                    <input {...register('pf_number')} disabled={isSelfService} className={inputCls(!!errors.pf_number)} />
                  </Field>
                  <Field label={t('auto.esi_number', 'ESI Number')} error={errors.esi_number?.message}>
                    <input {...register('esi_number')} disabled={isSelfService} className={inputCls(!!errors.esi_number)} />
                  </Field>
                </div>
              </div>
            )}

            {/* STEP 5: Banking */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label={t('auto.bank_name', 'Bank Name')} error={errors.bank_name?.message}>
                    <input {...register('bank_name')} disabled={isSelfService} className={inputCls(!!errors.bank_name)} placeholder={t('auto.hdfc_bank', 'HDFC Bank')} />
                  </Field>
                  <Field label={t('auto.account_number', 'Account Number')} error={errors.bank_account_number?.message}>
                    <input type="password" {...register('bank_account_number')} disabled={isSelfService} className={inputCls(!!errors.bank_account_number)} placeholder="1234567890" />
                  </Field>
                  <Field label={t('auto.ifsc_code', 'IFSC Code')} error={errors.bank_ifsc?.message}>
                    <input {...register('bank_ifsc')} disabled={isSelfService} className={inputCls(!!errors.bank_ifsc)} placeholder={t('auto.hdfc0001234', 'HDFC0001234')} />
                  </Field>
                </div>
              </div>
            )}

            {/* STEP 6: Review */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('auto.review_details', 'Review Details')}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block mb-1">{t('auto.name', 'Name')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{watch('first_name')} {watch('last_name')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">{t('auto.employee_code', 'Employee Code')}</span>
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">{watch('employee_code')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">{t('auto.official_email', 'Official Email')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{watch('work_email') || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1">{t('auto.joining_date', 'Joining Date')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{watch('date_of_joining')}</span>
                    </div>
                  </div>
                  <p className="mt-6 text-sm text-gray-500">
                    {t('auto.please_ensure_all_details_are_correct_identities_a', 'Please ensure all details are correct. Identities and Bank details will be encrypted in the database.')}
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50 flex justify-between items-center rounded-b-2xl">
          <button
            type="button"
            onClick={currentStep === 0 ? onClose : () => setCurrentStep(prev => prev - 1)}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-800 disabled:opacity-40 dark:border-gray-700 dark:bg-transparent dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {currentStep === 0 ? 'Cancel' : <><ChevronLeft className="h-4 w-4" /> {t('auto.back', 'Back')}</>}
          </button>
          
          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-70 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {t('auto.continue', 'Continue')} <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              form="employee-form"
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('auto.processing', 'Processing…')}</> : <><Save className="h-4 w-4" /> {t('auto.submit', 'Submit')}</>}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
