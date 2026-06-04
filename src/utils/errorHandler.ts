/**
 * Centralized Error Handling Utility
 * Provides consistent error handling across the application
 */

export interface ApiError {
  status: number;
  message: string;
  details?: string;
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof Response) {
    return {
      status: error.status,
      message: error.statusText || 'An error occurred',
      details: `HTTP ${error.status}`
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message,
      details: error.stack
    };
  }

  return {
    status: 500,
    message: 'An unexpected error occurred',
    details: String(error)
  };
};

export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as any).message);
  }

  return 'An unexpected error occurred';
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

export const validatePrice = (price: unknown): boolean => {
  const num = Number(price);
  return !isNaN(num) && num > 0;
};

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start < end;
  } catch {
    return false;
  }
};
