// yss_orbit/frontend/src/core/validation/schemas/businessUnitSchemas.ts
// FIXED: was a stub validating name, code, and a non-existent 'taxId' field.
// Now matches BusinessUnitCreateUpdateSerializer fields and validation rules exactly.
//
// Note: The primary form validation is in BusinessUnitFormModal.tsx (schema constant).
// This file provides a re-exportable schema for use in non-form contexts.

import { z } from 'zod';
import {
  GST_REGEX,
  PAN_REGEX,
  HEX_REGEX,
  PHONE_REGEX,
  CODE_REGEX,
} from '@/features/organization/businessUnit/constants/businessUnitConstants';

export const businessUnitSchema = z.object({
  // Identity (required)
  name:     z.string().min(2, 'Name must be at least 2 characters').max(255),
  code:     z
    .string()
    .min(2, 'Code is required')
    .max(20, 'Code must be 20 characters or fewer')
    .regex(CODE_REGEX, 'Uppercase letters, numbers, hyphens/underscores only'),
  industry: z.enum([
    'RETAIL', 'RESTAURANT', 'PHARMACY', 'WHOLESALE', 'SERVICES',
    'MANUFACTURING', 'ECOMMERCE', 'HEALTHCARE', 'EDUCATION', 'OTHER',
  ]),

  // Contact (optional)
  email:   z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  phone:   z.union([
    z.string().regex(PHONE_REGEX, 'Invalid phone number format'),
    z.literal(''),
  ]).optional(),

  // Address (optional)
  address_line1: z.string().max(255).optional().or(z.literal('')),
  address_line2: z.string().max(255).optional().or(z.literal('')),
  city:          z.string().max(100).optional().or(z.literal('')),
  state:         z.string().max(100).optional().or(z.literal('')),
  country:       z.string().length(2, 'Must be a 2-letter country code').default('IN'),
  pincode:       z.string().max(10).optional().or(z.literal('')),

  // Compliance (optional, format-validated)
  registration_number: z.string().max(100).optional().or(z.literal('')),
  gst_number: z.union([
    z.string().regex(GST_REGEX, 'Invalid GST format: 22AAAAA0000A1Z5'),
    z.literal(''),
  ]).optional(),
  pan_number: z.union([
    z.string().regex(PAN_REGEX, 'Invalid PAN format: ABCDE1234F'),
    z.literal(''),
  ]).optional(),

  // Locale (optional)
  timezone:      z.string().optional().or(z.literal('')),
  currency_code: z.string().length(3, 'Must be a 3-letter currency code').optional().or(z.literal('')),

  // Branding (optional)
  primary_color: z.union([
    z.string().regex(HEX_REGEX, 'Must be a 6-digit hex color, e.g. #6366F1'),
    z.literal(''),
  ]).optional(),
  logo_url: z.union([z.string(), z.literal(''), z.null()]).optional(),

  // Flags
  is_main_branch: z.boolean().default(false),
  is_active:      z.boolean().default(true),

  // References
  manager_id: z.string().uuid('Invalid UUID').optional().or(z.literal('')),

  // Audit
  reason: z.string().optional(),
});

export type BusinessUnitFormValues = z.infer<typeof businessUnitSchema>;
