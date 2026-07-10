import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  phone_number: z.string().optional().nullable(),
  is_active: z.boolean(),
  is_deleted: z.boolean().optional(),
  is_email_verified: z.boolean().optional(),
  is_super_admin: z.boolean(),
  is_staff: z.boolean().optional(),
  language: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  last_login_at: z.string().optional().nullable(),
  created_at: z.string().optional(),
  created_by_id: z.string().optional().nullable(),
  created_reason: z.string().optional().nullable(),
  updated_at: z.string().optional(),
  updated_by_id: z.string().optional().nullable(),
  updated_reason: z.string().optional().nullable(),
  deleted_at: z.string().optional().nullable(),
  deleted_by_id: z.string().optional().nullable(),
  deleted_reason: z.string().optional().nullable(),
  restored_at: z.string().optional().nullable(),
  restored_by_id: z.string().optional().nullable(),
  restored_reason: z.string().optional().nullable(),
});

export type User = z.infer<typeof userSchema>;

export const userCreateSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone_number: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  is_active: z.boolean().default(true),
  is_super_admin: z.boolean().default(false),
  reason: z.string().optional(),
});

export type UserCreatePayload = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = userCreateSchema.partial().extend({
  password: z.string().min(8).optional().or(z.literal('')),
});
export type UserUpdatePayload = z.infer<typeof userUpdateSchema>;

export interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  is_deleted?: boolean;
  is_email_verified?: boolean;
  is_super_admin?: boolean;
  is_staff?: boolean;
}

export interface UserListMeta {
  count: number;
  total: number;
  total_active: number;
  total_inactive: number;
  total_deleted: number;
  page: number;
  page_size: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
}

export interface UserListResponse {
  results: User[];
  meta: UserListMeta;
}
