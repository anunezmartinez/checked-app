// src/app/core/notification.service.ts
import { Injectable } from '@angular/core';
import { Check } from '../checks/models/check.model';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationPermissionGranted = false;
  private checkIntervalId: any;
  private checkIntervalMs = 60000; // Check every minute

  constructor(private toastr: ToastrService) {
    this.requestNotificationPermission();
  }

  async requestNotificationPermission(): Promise<void> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      this.notificationPermissionGranted = true;
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.notificationPermissionGranted = permission === 'granted';
    }
  }

  startCheckingForDueChecks(getDueChecksFn: () => Check[]): void {
    // Clear any existing interval
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }

    // Set up interval to check for due checks
    this.checkIntervalId = setInterval(() => {
      const dueChecks = getDueChecksFn();
      
      dueChecks.forEach(check => {
        if (check.notification_enabled) {
          this.sendNotification(check);
        }
      });
    }, this.checkIntervalMs);
  }

  stopCheckingForDueChecks(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  sendNotification(check: Check): void {
    const notificationTitle = `Reminder: ${check.name}`;
    const notificationBody = check.description || 'Time to check this item!';
    
    // In-app notification using Toastr
    this.toastr.info(notificationBody, notificationTitle, {
      timeOut: 0, // Don't auto-dismiss
      closeButton: true
    });
    
    // Browser notification if permission granted
    if (this.notificationPermissionGranted) {
      const notification = new Notification(notificationTitle, {
        body: notificationBody,
        icon: 'assets/icons/icon-72x72.png', // Path to your app icon
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }
}
