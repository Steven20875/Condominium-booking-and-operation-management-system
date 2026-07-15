import { db } from '../db';

/**
 * PaymentService - OOP wrapper around payment operations
 */
export class PaymentService {
  getPayments() {
    return db.getPayments();
  }

  getUserPayments(userId: string) {
    return db.getUserPayments(userId);
  }

  submitPayment(paymentId: string, method: string, reference: string, amountPaid: number, residentId: string, residentName: string) {
    return db.submitPayment(paymentId, method, reference, amountPaid, residentId, residentName);
  }

  generateManualPayment(payment: any, operatorId: string, operatorName: string) {
    return db.generateManualPayment(payment, operatorId, operatorName);
  }
}

export const paymentService = new PaymentService();
