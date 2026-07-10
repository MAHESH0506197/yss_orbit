import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\features\hrms\components\EmployeeForm.tsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';

// Minimal payload shape for this legacy form — full type lives in EmployeeFormValues
interface CreateEmployeePayload {
  name: string;
  email: string;
  phone: string;
  businessUnit: string;
  role: string;
  designation: string;
}

// Thin wrapper so EmployeeForm doesn't depend on useEmployeeMutations hook shape
const createEmployee = async (payload: CreateEmployeePayload) => {
  const { data } = await apiClient.post('/api/v1/hrms/employees/', payload);
  return data;
};

interface EmployeeFormProps {
  onSuccess: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateEmployeePayload>({
    name: '',
    email: '',
    phone: '',
    businessUnit: 'Engineering',
    role: 'Employee',
    designation: '',
  });

  const mutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onSuccess();
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: CreateEmployeePayload) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text)]">{t('auto.full_name', 'Full Name')}</label>
        <input
          type="text"
          name="name"
          id="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text)]">{t('auto.email_address', 'Email Address')}</label>
        <input
          type="email"
          name="email"
          id="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-[var(--color-text)]">{t('auto.phone_number', 'Phone Number')}</label>
        <input
          type="tel"
          name="phone"
          id="phone"
          required
          value={formData.phone}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="businessUnit" className="block text-sm font-medium text-[var(--color-text)]">{t('auto.business_unit', 'Business Unit')}</label>
        <select
          name="businessUnit"
          id="businessUnit"
          value={formData.businessUnit}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] sm:text-sm"
        >
          <option value="Engineering">{t('auto.engineering', 'Engineering')}</option>
          <option value="Marketing">{t('auto.marketing', 'Marketing')}</option>
          <option value="Sales">{t('auto.sales', 'Sales')}</option>
          <option value="HR">{t('auto.hr', 'HR')}</option>
          <option value="Finance">{t('auto.finance', 'Finance')}</option>
        </select>
      </div>
      <div>
        <label htmlFor="designation" className="block text-sm font-medium text-[var(--color-text)]">{t('auto.designation', 'Designation')}</label>
        <input
          type="text"
          name="designation"
          id="designation"
          required
          value={formData.designation}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-[var(--color-text)]">{t('auto.role', 'Role')}</label>
        <select
          name="role"
          id="role"
          value={formData.role}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] sm:text-sm"
        >
          <option value="Employee">{t('auto.employee', 'Employee')}</option>
          <option value="Manager">{t('auto.manager', 'Manager')}</option>
          <option value="Admin">{t('auto.admin', 'Admin')}</option>
        </select>
      </div>
      
      {mutation.isError && (
        <div className="text-sm text-[var(--color-danger)] mt-2">
          {t('auto.failed_to_create_employee_please_try_again', 'Failed to create employee. Please try again.')}
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <Button type="submit" loading={mutation.isPending}>
          {t('auto.save_employee', 'Save Employee')}
        </Button>
      </div>
    </form>
  );
};
