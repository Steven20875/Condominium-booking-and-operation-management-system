import { db } from '../db';

/**
 * NotificationService - manages notifications and a FIFO queue for dispatch
 */
export class NotificationService {
  private queue: any[] = [];

  constructor(private readonly database: typeof db = db) {}

  enqueue(notification: any) {
    const n = this.database.createNotification(notification);
    this.queue.push(n);
    // keep queue size reasonable
    if (this.queue.length > 200) this.queue.shift();
    return n;
  }

  dequeue() {
    return this.queue.shift();
  }

  getNotifications(userId: string, role: string) {
    return this.database.getNotifications(userId, role);
  }

  markAsRead(id: string, userId: string, role: string) {
    return this.database.markNotificationAsRead(id, userId, role);
  }

  markAllAsRead(userId: string, role: string) {
    return this.database.markAllNotificationsAsRead(userId, role);
  }
}

export const notificationService = new NotificationService();
