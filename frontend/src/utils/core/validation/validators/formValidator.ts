// yss_orbit\frontend\src\core\validation\validators\formValidator.ts
import { z } from 'zod';
import { formatZodError } from '../utils/validationHelpers';

export const validateForm = <T>(schema: z.Schema<T>, data: unknown): { isValid: boolean, data?: T, errors: Record<string, string> } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { isValid: true, data: result.data, errors: {} };
  } else {
    return { isValid: false, errors: formatZodError(result.error) };
  }
};
