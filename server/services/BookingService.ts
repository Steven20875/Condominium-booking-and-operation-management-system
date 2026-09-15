import { db } from '../db/index';

/**
 * BookingService - OOP wrapper around booking-related operations
 * Provides a clear service boundary for business logic and easier unit testing
 */
export class BookingService {
  constructor(private readonly database: typeof db = db) {}

  createBooking(booking: any) {
    return this.database.createBooking(booking);
  }

  getBookings() {
    return this.database.getBookings();
  }

  findBookingById(id: string) {
    return this.database.findBookingById(id);
  }

  updateBookingStatus(id: string, status: 'Approved' | 'Rejected' | 'Cancelled' | 'Completed', operatorId: string, operatorName: string) {
    return this.database.updateBookingStatus(id, status, operatorId, operatorName);
  }

  getUserBookings(userId: string) {
    return this.database.getUserBookings(userId);
  }
}

export const bookingService = new BookingService();
