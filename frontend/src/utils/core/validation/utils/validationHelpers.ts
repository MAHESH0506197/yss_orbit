// yss_orbit\frontend\src\core\validation\utils\validationHelpers.ts
import { ZodError } from 'zod';

export const formatZodError = (error: ZodError): Record<string, string> => {
  const formatted: Record<string, string> = {};
  error.errors.forEach(err => {
    if (err.path.length > 0) {
      formatted[err.path.join('.')] = err.message;
    }
  });
  return formatted;
};
