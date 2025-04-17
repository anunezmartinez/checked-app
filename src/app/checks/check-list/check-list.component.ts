// src/app/checks/check-list/check-list.component.ts
import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { Check } from '../models/check.model';
import { CheckService } from '../check.service';
import { NotificationService } from '../../core/notification.service';
import { interval, Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';


import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-check-list',
  templateUrl: './check-list.component.html',
  styleUrls: ['./check-list.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
]
})
export class CheckListComponent implements OnInit, OnDestroy {
  checks: Check[] = [];
  loading = true;
  error = '';
  refreshInterval = 60000; // 1 minute in milliseconds
  private refreshSubscription?: Subscription;

  constructor(
    private checkService: CheckService,
    private notificationService: NotificationService,
    private toastr: ToastrService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadChecks();
    this.setupAutoRefresh();

    // Start notification service with our getDueChecks function
    this.notificationService.startCheckingForDueChecks(() => this.getDueChecks());
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    this.notificationService.stopCheckingForDueChecks();
  }

  loadChecks(): void {
    this.loading = true;
    this.checkService.getAllChecks().subscribe({
      next: (checks) => {
        this.checks = checks;
        this.loading = false;
        this.checkService.updateLocalCache(checks); // Update local cache for offline use
      },
      error: (err) => {
        this.error = 'Failed to load checks. Please try again.';
        this.loading = false;
        console.error('Error loading checks:', err);
      }
    });
  }

  setupAutoRefresh(): void {
    this.refreshSubscription = interval(this.refreshInterval).subscribe(() => {
      this.loadChecks();
    });
  }

  getDueChecks(): Check[] {
    const now = new Date();
    return this.checks.filter(check => {
      // If never checked, it's due
      if (!check.last_checked) {
        return true;
      }

      const lastChecked = new Date(check.last_checked);
      const minutesSinceLastCheck = (now.getTime() - lastChecked.getTime()) / (1000 * 60);

      return minutesSinceLastCheck >= check.periodicity;
    });
  }

  getUpcomingChecks(): Check[] {
    // This returns checks that are not due yet (the opposite of isDue)
    return this.checks.filter(check => !this.isDue(check));
  }

  isDue(check: Check): boolean {
    if (!check.last_checked) {
      return true;
    }

    const now = new Date();
    const lastChecked = new Date(check.last_checked);
    const minutesSinceLastCheck = (now.getTime() - lastChecked.getTime()) / (1000 * 60);

    return minutesSinceLastCheck >= check.periodicity;
  }

  getNextDueTime(check: Check): string {
    if (!check.last_checked) {
      return 'Now';
    }

    const lastChecked = new Date(check.last_checked);
    const nextDue = new Date(lastChecked.getTime() + check.periodicity * 60000);
    const now = new Date();

    if (nextDue <= now) {
      return 'Now';
    }

    const minutesRemaining = Math.floor((nextDue.getTime() - now.getTime()) / 60000);

    if (minutesRemaining < 60) {
      return `${minutesRemaining} min`;
    } else if (minutesRemaining < 1440) { // Less than a day
      return `${Math.floor(minutesRemaining / 60)} hr ${minutesRemaining % 60} min`;
    } else {
      return `${Math.floor(minutesRemaining / 1440)} days`;
    }
  }

  recordCheck(check: Check, event: Event): void {
    event.stopPropagation(); // Prevent navigating to detail view

    this.checkService.recordCheck(check._id).subscribe({
      next: (response) => {
        // Update local check object
        check.last_checked = response.checked_at;

        this.toastr.success(`${check.name} marked as completed!`);

        // Update local cache
        this.checkService.updateLocalCache(this.checks);
      },
      error: (err) => {
        this.toastr.error('Failed to record check. Please try again.');
        console.error('Error recording check:', err);
      }
    });
  }

  createCheck(): void {
    this.router.navigate(['/checks/create']);
  }

  navigateToDetail(check: Check): void {
    this.router.navigate(['/checks', check._id]);
  }

  getLastCheckedString(check: Check): string {
    if (!check.last_checked) {
      return 'Never';
    }

    const lastChecked = new Date(check.last_checked);
    const now = new Date();
    const minutesSince = Math.floor((now.getTime() - lastChecked.getTime()) / 60000);

    if (minutesSince < 1) {
      return 'Just now';
    } else if (minutesSince < 60) {
      return `${minutesSince} min ago`;
    } else if (minutesSince < 1440) { // Less than a day
      return `${Math.floor(minutesSince / 60)} hr ago`;
    } else {
      return `${Math.floor(minutesSince / 1440)} days ago`;
    }
  }
}