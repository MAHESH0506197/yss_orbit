export interface UserRole {
  id: string;
  user_id: string;
  business_unit_id: string;
  role_id: string;
  role_name: string;
  role_type: string;
  is_active: boolean;
  assigned_by_id?: string;
  assigned_by_name?: string;
  assigned_at?: string;
  revoked_at?: string;
}

export interface UserRoleCreatePayload {
  user_id: string;
  business_unit_id: string;
  role_id: string;
}

export interface UserRoleUpdatePayload {
  role_id: string;
}

export interface UserRoleListResponse {
  results: UserRole[];
  meta?: any;
}
