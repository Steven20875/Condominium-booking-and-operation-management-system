import { db } from '../db';

/**
 * BookingService - OOP wrapper around booking-related operations
 * Provides a clear service boundary for business logic and easier unit testing
 */
export class BookingService {
  createBooking(booking: any) {
    return db.createBooking(booking);
  }

  getBookings() {
    return db.getBookings();
  }

  findBookingById(id: string) {
    return db.findBookingById(id);
  }

  updateBookingStatus(id: string, status: 'Approved' | 'Rejected' | 'Cancelled' | 'Completed', operatorId: string, operatorName: string) {
    return db.updateBookingStatus(id, status, operatorId, operatorName);
  }

  getUserBookings(userId: string) {
    return db.getUserBookings(userId);
  }
}

export const bookingService = new BookingService();
