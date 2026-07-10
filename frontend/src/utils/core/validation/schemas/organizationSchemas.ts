// yss_orbit/frontend/src/core/validation/schemas/organizationSchemas.ts
// FIXED: was referencing removed 'domain' field which no longer exists on Organization.
// Updated to match OrganizationCreateUpdateSerializer fields exactly.
//
// Note: The primary form validation is in OrganizationFormModal.tsx (getSchema()).
// This file provides a re-exportable schema for use in non-form contexts
// (e.g. management pages, data imports, validation utilities).

import { z } from 'zod';

const SLUG_REGEX = /^[a-z0-9-]+$/;

export const organizationSchema = z.object({
  name:     z.string().min(2, 'Organization name must be at least 2 characters').max(255),
  slug:     z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(255)
    .regex(SLUG_REGEX, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  email:    z.union([z.string().email('Must be a valid email'), z.literal('')]).optional(),
  logo_url: z.union([z.string(), z.literal(''), z.null()]).optional(),
  is_active: z.boolean().default(true),
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;
