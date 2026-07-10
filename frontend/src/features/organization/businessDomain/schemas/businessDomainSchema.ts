import { z } from 'zod';

export const businessDomainSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  code: z.string().min(6, 'Code must start with BDOM- (min 6 characters)').startsWith('BDOM-', 'Code must start with BDOM-').max(20, 'Code cannot exceed 20 characters').toUpperCase(),
  description: z.string().optional(),
  logo_url: z.union([z.string(), z.literal(''), z.null()]).optional(),
  is_active: z.boolean().default(true),
  reason: z.string().optional(),
});

export type BusinessDomainFormValues = z.infer<typeof businessDomainSchema>;
