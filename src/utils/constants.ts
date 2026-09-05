/**
 * Application Constants
 * Centralized configuration values
 */

export const APP_NAME = 'ONE SPATIAL ILOILO';
export const APP_COMPANY = 'GALES URBAN HAVEN';
export const APP_LOCATION = 'Mandurriao, Iloilo City, Iloilo, Philippines';

export const API_ENDPOINTS = {
  // Authentication
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_ME: '/api/auth/me',
  AUTH_PROFILE: '/api/auth/profile',

  // Units
  UNITS: '/api/units',
  UNIT_DETAIL: (id: string) => `/api/units/${id}`,

  // Bookings
  BOOKINGS: '/api/bookings',
  BOOKING_STATUS: (id: string) => `/api/bookings/${id}/status`,

  // Payments
  PAYMENTS: '/api/payments',
  PAYMENT_PAY: (id: string) => `/api/payments/${id}/pay`,
  PAYMENT_MANUAL: '/api/payments/manual',
  PUBLIC_PAYMENT: (id: string) => `/api/public/payments/${id}`,
  PUBLIC_PAYMENT_PAY: (id: string) => `/api/public/payments/${id}/pay`,

  // Maintenance
  MAINTENANCE: '/api/maintenance',
  MAINTENANCE_UPDATE: (id: string) => `/api/maintenance/${id}`,

  // Notifications
  NOTIFICATIONS: '/api/notifications',
  NOTIFICATION_READ: (id: string) => `/api/notifications/read/${id}`,
  NOTIFICATION_READ_ALL: '/api/notifications/read-all',
  NOTIFICATION_ANNOUNCE: '/api/notifications/announce',

  // Admin
  RESIDENTS: '/api/residents',
  DASHBOARD_STATS: '/api/dashboard/stats',
  LOGS: '/api/logs',

  // Chatbot
  CHATBOT: '/api/chatbot',
};

export const BOOKING_STATUSES = ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'] as const;
export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded'] as const;
export const MAINTENANCE_STATUSES = ['Pending', 'Assigned', 'In Progress', 'Completed', 'Deferred'] as const;
export const MAINTENANCE_PRIORITIES = ['Low', 'Medium', 'High', 'Emergency'] as const;
export const UNIT_STATUSES = ['Available', 'Booked', 'Maintenance'] as const;

export const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'Bank Transfer', 'E-Wallet', 'QR PH'] as const;

export const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'alert'] as const;

export const TOAST_DURATION = 3000; // milliseconds

export const PAGINATION = {
  ITEMS_PER_PAGE: 10,
  MAX_ITEMS: 100,
};

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_PRICE: 0.01,
  MAX_PRICE: 999999.99,
};

export const COLORS = {
  primary: '#0f172a',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};
