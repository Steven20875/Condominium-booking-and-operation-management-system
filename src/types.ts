/**
 * Shared Type Definitions for the Condominium Booking and Operation Management System
 */

export type UserRole = 'admin' | 'resident';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  unitNumber?: string;
  avatarUrl?: string;
  createdAt: string;
  password?: string; // Kept in backend, stripped on API responses
}

export type UnitStatus = 'Available' | 'Booked' | 'Maintenance';

export interface Unit {
  id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  amenities: string[];
  availability: boolean;
  capacity: number;
  floorNumber: number;
  status: UnitStatus;
  images: string[]; // URLs or base64 data items
  createdAt: string;
}

export type BookingStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Completed';

export interface Booking {
  id: string;
  unitId: string;
  unitName?: string; // Resolved for UI
  residentId: string;
  residentName?: string; // Resolved for UI
  residentEmail?: string; // Resolved for UI
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: BookingStatus;
  guestsCount: number;
  notes?: string;
  createdAt: string;
}

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';
export type PaymentMethod = 'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'E-Wallet';

export interface Payment {
  id: string;
  bookingId: string;
  residentId: string;
  residentName?: string;
  unitName?: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  referenceNumber: string;
  paidAt?: string;
  createdAt: string;
}

export type MaintenanceStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Deferred';
export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Emergency';

export interface MaintenanceRequest {
  id: string;
  residentId: string;
  residentName?: string;
  unitNumber: string;
  issueType: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedStaff?: string;
  resolvedAt?: string;
  images?: string[];
  createdAt: string;
}

export interface CondoNotification {
  id: string;
  title: string;
  message: string;
  recipientId: string; // 'all' for global announcement, or custom user IDs
  recipientRole?: UserRole | 'all';
  isRead: boolean;
  type: 'info' | 'success' | 'warning' | 'alert';
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  createdAt: string;
}

export interface DashboardStats {
  totalResidents: number;
  totalUnits: number;
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  pendingRequestsCount: number;
  monthlyRevenue: { month: string; revenue: number }[];
  bookingStatusData: { name: string; value: number }[];
  unitTypeAvailability: { type: string; count: number }[];
  maintenancePriorityData: { name: string; value: number }[];
}
