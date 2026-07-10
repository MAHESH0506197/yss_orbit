// yss_orbit\frontend\src\core\validation\validators\apiValidator.ts
import { z } from 'zod';
import { formatZodError } from '../utils/validationHelpers';

export const validatePayload = <T>(schema: z.Schema<T>, data: unknown): { success: boolean, data?: T, errors?: Record<string, string> } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: formatZodError(result.error) };
  }
};
