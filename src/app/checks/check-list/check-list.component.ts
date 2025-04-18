// src/app/checks/check-list/check-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-check-list',
  templateUrl: './check-list.component.html',
  styleUrls: ['./check-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatOptionModule
  ]
})
export class CheckListComponent implements OnInit, OnDestroy {
  checks: Check[] = [];
  filteredChecks: Check[] = [];
  groups: string[] = [];
  selectedGroup: string | null = null;
  loading = true;
  error = '';
  refreshInterval = 60000;
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
        this.updateGroups();
        this.applyGroupFilter();
        this.loading = false;
        this.checkService.updateLocalCache(checks);
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

  updateGroups(): void {
    this.groups = [...new Set(this.checks.map(c => c.group).filter((group): group is string => group !== undefined))];
  }

  applyGroupFilter(): void {
    if (this.selectedGroup) {
      this.filteredChecks = this.checks.filter(c => c.group === this.selectedGroup);
    } else {
      this.filteredChecks = [...this.checks];
    }
  }

  onGroupFilterChange(group: string | null): void {
    this.selectedGroup = group;
    this.applyGroupFilter();
  }

  onGroupCreated(group: string): void {
    if (!this.groups.includes(group)) {
      this.groups.push(group);
    }
  }

  getDueChecks(): Check[] {
    const now = new Date();
    return this.filteredChecks.filter(check => {
      if (!check.last_checked) return true;
      const lastChecked = new Date(check.last_checked);
      const minutesSince = (now.getTime() - lastChecked.getTime()) / (1000 * 60);
      return minutesSince >= check.periodicity;
    });
  }

  getUpcomingChecks(): Check[] {
    return this.filteredChecks.filter(check => !this.isDue(check));
  }

  isDue(check: Check): boolean {
    if (!check.last_checked) return true;
    const now = new Date();
    const lastChecked = new Date(check.last_checked);
    const minutesSince = (now.getTime() - lastChecked.getTime()) / (1000 * 60);
    return minutesSince >= check.periodicity;
  }

  getNextDueTime(check: Check): string {
    if (!check.last_checked) return 'Now';
    const lastChecked = new Date(check.last_checked);
    const nextDue = new Date(lastChecked.getTime() + check.periodicity * 60000);
    const now = new Date();

    if (nextDue <= now) return 'Now';

    const minutesRemaining = Math.floor((nextDue.getTime() - now.getTime()) / 60000);
    if (minutesRemaining < 60) return `${minutesRemaining} min`;
    if (minutesRemaining < 1440) return `${Math.floor(minutesRemaining / 60)} hr ${minutesRemaining % 60} min`;
    return `${Math.floor(minutesRemaining / 1440)} days`;
  }

  recordCheck(check: Check, event: Event): void {
    event.stopPropagation();

    this.checkService.recordCheck(check._id).subscribe({
      next: (response) => {
        check.last_checked = response.checked_at;
        this.toastr.success(`${check.name} marked as completed!`);
        this.checkService.updateLocalCache(this.checks);
        this.applyGroupFilter(); // update filtered view
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
    if (!check.last_checked) return 'Never';

    const lastChecked = new Date(check.last_checked);
    const now = new Date();
    const minutesSince = Math.floor((now.getTime() - lastChecked.getTime()) / 60000);

    if (minutesSince < 1) return 'Just now';
    if (minutesSince < 60) return `${minutesSince} min ago`;
    if (minutesSince < 1440) return `${Math.floor(minutesSince / 60)} hr ago`;
    return `${Math.floor(minutesSince / 1440)} days ago`;
  }

  getPeriodLabel(check: Check): string {
    if (!check.periodicity) return '';
    if (check.periodicity <= 60) return 'today';
    if (check.periodicity <= 60 * 24 * 2) return 'every 1–2 days';
    if (check.periodicity <= 60 * 24 * 7) return 'this week';
    if (check.periodicity <= 60 * 24 * 14) return 'every 2 weeks';
    return 'less frequent';
  }
}
