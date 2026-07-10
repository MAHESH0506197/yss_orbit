// yss_orbit\frontend\src\core\validation\schemas\userSchemas.ts
import { z } from 'zod';

export const userProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email')
});
