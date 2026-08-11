import { db } from '../db';

/**
 * PaymentService - OOP wrapper around payment operations
 */
export class PaymentService {
  constructor(private readonly database: typeof db = db) {}

  getPayments() {
    return this.database.getPayments();
  }

  getUserPayments(userId: string) {
    return this.database.getUserPayments(userId);
  }

  submitPayment(paymentId: string, method: string, reference: string, amountPaid: number, residentId: string, residentName: string) {
    return this.database.submitPayment(paymentId, method, reference, amountPaid, residentId, residentName);
  }

  generateManualPayment(payment: any, operatorId: string, operatorName: string) {
    return this.database.generateManualPayment(payment, operatorId, operatorName);
  }
}

export const paymentService = new PaymentService();
