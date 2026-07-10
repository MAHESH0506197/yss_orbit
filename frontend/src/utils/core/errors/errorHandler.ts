// yss_orbit\frontend\src\core\errors\errorHandler.ts
import { ERROR_CODES } from './errorCodes';

export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export const handleError = (error: any): AppError => {
  if (error.response) {
    // The request was made and the server responded with a status code outside 2xx
    const status = error.response.status;
    const data = error.response.data;

    if (status === 401) return { code: ERROR_CODES.UNAUTHORIZED, message: 'Session expired' };
    if (status === 403) return { code: ERROR_CODES.FORBIDDEN, message: 'Access denied' };
    if (status === 400) return { code: ERROR_CODES.VALIDATION_FAILED, message: data?.message || 'Validation failed', details: data };
    
    return { code: ERROR_CODES.INTERNAL_ERROR, message: 'Server error occurred' };
  } else if (error.request) {
    // The request was made but no response was received
    return { code: ERROR_CODES.NETWORK_ERROR, message: 'Network connection failed' };
  } else {
    // Something happened in setting up the request
    return { code: ERROR_CODES.INTERNAL_ERROR, message: error.message };
  }
};
