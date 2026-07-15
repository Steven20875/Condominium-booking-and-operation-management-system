import { db } from '../db';

/**
 * NotificationService - manages notifications and a FIFO queue for dispatch
 */
export class NotificationService {
  private queue: any[] = [];

  enqueue(notification: any) {
    const n = db.createNotification(notification);
    this.queue.push(n);
    // keep queue size reasonable
    if (this.queue.length > 200) this.queue.shift();
    return n;
  }

  dequeue() {
    return this.queue.shift();
  }

  getNotifications(userId: string, role: string) {
    return db.getNotifications(userId, role);
  }

  markAsRead(id: string, userId: string) {
    return db.markNotificationAsRead(id, userId);
  }

  markAllAsRead(userId: string, role: string) {
    return db.markAllNotificationsAsRead(userId, role);
  }
}

export const notificationService = new NotificationService();
