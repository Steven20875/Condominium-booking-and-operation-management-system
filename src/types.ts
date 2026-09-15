/**
 * Shared Type Definitions for the Condominium Booking and Operation Management System
 */

export type UserRole = 'admin' | 'resident';
export type GovernmentIdStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  unitNumber?: string;
  avatarUrl?: string;
  authProvider?: 'email' | 'google' | 'firebase';
  authUid?: string;
  emailVerified?: boolean;
  hasValidId?: boolean;
  governmentIdStatus?: GovernmentIdStatus;
  governmentIdUrl?: string;
  governmentIdUploadedAt?: string;
  governmentIdVerifiedAt?: string;
  governmentIdRejectionReason?: string;
  validIdVerifiedAt?: string;
  createdAt: string;
  password?: string; // Kept in backend, stripped on API responses
}

export type UnitStatus = 'Available' | 'Occupied' | 'Maintenance';

export interface Unit {
  id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  availability: boolean;
  capacity: number;
  status: UnitStatus;
  images: string[]; // URLs or base64 data items
  amenities?: string[]; // kept optional for compatibility with legacy data
  floorNumber?: number; // kept optional for compatibility with legacy data
  createdAt: string;
}

export type BookingStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Completed' | 'Partially Paid';

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

export type PaymentStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Failed' | 'Refunded';
export type PaymentMethod = 'Cash';

export interface Payment {
  id: string;
  bookingId: string;
  residentId: string;
  residentName?: string;
  unitName?: string;
  amount: number; // total invoice amount
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  downpaymentAmount: number;
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
  totalInvoices: number;
  pendingPayments: number;
  occupancyRate: number;
  pendingRequestsCount: number;
  unresolvedMaintenance: number;
  monthlyRevenue: { month: string; revenue: number }[];
  bookingStatusData: { name: string; value: number }[];
  unitTypeAvailability: { type: string; count: number }[];
  maintenancePriorityData: { name: string; value: number }[];
}
