import { useTranslation } from 'react-i18next';
import { z } from 'zod';

export enum EmploymentStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  NOTICE_PERIOD = 'NOTICE_PERIOD',
  TERMINATED = 'TERMINATED',
  RESIGNED = 'RESIGNED',
  RETIRED = 'RETIRED'
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
  CONSULTANT = 'CONSULTANT'
}

export interface Employee {
  id: string;


  // Identity
  employee_code: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  gender?: string;
  date_of_birth?: string;
  marital_status?: string;
  nationality?: string;
  blood_group?: string;

  // Contact
  personal_email?: string;
  work_email?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;

  // Address
  current_address?: string;
  permanent_address?: string;

  // Identity Docs
  aadhaar_number?: string;
  pan_number?: string;
  passport_number?: string;

  // Employment
  department: string | null;
  department_name?: string;
  designation: string | null;
  designation_name?: string;
  employment_type: string;
  employment_status: string;

  // Dates
  date_of_joining: string;
  probation_end_date?: string | null;
  confirmation_date?: string | null;
  date_of_leaving?: string | null;
  resignation_date?: string | null;

  // Reporting
  reporting_manager_id: string | null;

  // Linkage
  user_id: string | null;
  linked_user_name?: string | null;
  business_unit_id: string;

  // Compensation
  ctc: number;
  basic_salary: number;

  // Bank
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  pf_number?: string;
  esi_number?: string;

  // Leave balance (denormalized JSON)
  leave_balance?: Record<string, any>;

  // Photo
  photo_url?: string | null;

  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface EmployeeFilters {
  search?: string;
  department_id?: string;
  employment_status?: string;
  employment_type?: string;
  page?: number;
  page_size?: number;
  is_active?: boolean;
}

export const employeeSchema = z.object({
  // Identity
  employee_code: z.string().optional().or(z.literal('')),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  middle_name: z.string().optional(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  marital_status: z.string().optional(),
  nationality: z.string().default('Indian'),
  blood_group: z.string().optional(),
  photo_url: z.string().optional().nullable(),

  // Employment
  department: z.string().uuid().optional().nullable(),
  designation: z.string().uuid().optional().nullable(),
  reporting_manager_id: z.string().uuid().optional().nullable(),
  employment_type: z.string().default('FULL_TIME'),
  employment_status: z.string().default('ACTIVE'),
  date_of_joining: z.string().min(1, 'Joining date is required'),
  probation_end_date: z.string().optional().nullable(),
  confirmation_date: z.string().optional().nullable(),
  ctc: z.number().min(0).default(0),
  basic_salary: z.number().min(0).default(0),

  // Contact
  personal_email: z.string().email('Invalid personal email format').or(z.literal('')).optional(),
  work_email: z.string().email('Invalid official email format').or(z.literal('')).optional(),
  phone: z.string().regex(/^[0-9]{10,15}$/, 'Invalid phone number format').or(z.literal('')).optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().regex(/^[0-9]{10,15}$/, 'Invalid phone number format').or(z.literal('')).optional(),
  current_address: z.string().optional(),
  permanent_address: z.string().optional(),

  // Identity Docs
  aadhaar_number: z.string().regex(/^[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}$/, 'Invalid Aadhaar format').or(z.literal('')).optional(),
  pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').or(z.literal('')).optional(),
  passport_number: z.string().optional(),
  pf_number: z.string().optional(),
  esi_number: z.string().optional(),

  // Banking
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format').or(z.literal('')).optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
