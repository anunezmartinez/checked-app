// src/app/checks/check-detail/check-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Check } from '../models/check.model';
import { CheckService } from '../check.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatOption } from '@angular/material/select';


@Component({
  selector: 'app-check-detail',
  templateUrl: './check-detail.component.html',
  styleUrls: ['./check-detail.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatOption
  ]
})
export class CheckDetailComponent implements OnInit {
  checkId: string;
  check: Check | null = null;
  checkForm: FormGroup;
  loading = true;
  submitting = false;
  error = '';
  editing = false;
  periodicityOptions = [
    { value: 60, label: '1 hour' },
    { value: 180, label: '3 hours' },
    { value: 360, label: '6 hours' },
    { value: 720, label: '12 hours' },
    { value: 1440, label: '24 hours' },
    { value: 10080, label: '1 week' },
    { value: 43200, label: '30 days' }
  ];
  customPeriodicity = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private checkService: CheckService,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {
    this.checkId = this.route.snapshot.paramMap.get('id') || '';
    
    // Initialize form with empty values (will be populated once check is loaded)
    this.checkForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', Validators.maxLength(200)],
      periodicity: [60, Validators.required],
      customPeriodicityValue: [null],
      customPeriodicityUnit: ['minutes'],
      notification_enabled: [true]
    });
  }

  ngOnInit(): void {
    this.loadCheck();
    
    // Set up form logic for custom periodicity
    this.checkForm.get('periodicity')?.valueChanges.subscribe(value => {
      if (value === 'custom') {
        this.customPeriodicity = true;
        this.checkForm.get('customPeriodicityValue')?.setValidators([
          Validators.required, 
          Validators.min(1),
          Validators.pattern(/^[0-9]+$/)
        ]);
      } else {
        this.customPeriodicity = false;
        this.checkForm.get('customPeriodicityValue')?.clearValidators();
      }
      this.checkForm.get('customPeriodicityValue')?.updateValueAndValidity();
    });
  }

  loadCheck(): void {
    this.loading = true;
    this.checkService.getCheckById(this.checkId).subscribe({
      next: (check) => {
        this.check = check;
        
        // Find if periodicity matches a predefined option or needs custom
        let periodicity = check.periodicity;
        let customPeriodicityValue = null;
        let customPeriodicityUnit = 'minutes';
        
        const matchingOption = this.periodicityOptions.find(option => option.value === periodicity);
        
        if (!matchingOption) {
          // Custom periodicity calculation
          if (periodicity % 10080 === 0) {
            customPeriodicityValue = periodicity / 10080;
            customPeriodicityUnit = 'weeks';
          } else if (periodicity % 1440 === 0) {
            customPeriodicityValue = periodicity / 1440;
            customPeriodicityUnit = 'days';
          } else if (periodicity % 60 === 0) {
            customPeriodicityValue = periodicity / 60;
            customPeriodicityUnit = 'hours';
          } else {
            customPeriodicityValue = periodicity;
            customPeriodicityUnit = 'minutes';
          }
          
          periodicity = -1; // Use a special value to represent 'custom'
        }
        
        // Populate the form
        this.checkForm.patchValue({
          name: check.name,
          description: check.description,
          periodicity: periodicity,
          customPeriodicityValue: customPeriodicityValue,
          customPeriodicityUnit: customPeriodicityUnit,
          notification_enabled: check.notification_enabled
        });
        
        if (typeof periodicity === 'string' && periodicity === 'custom') {
          this.customPeriodicity = true;
        }
        
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load check details. It may have been deleted.';
        this.loading = false;
        console.error('Error loading check details:', err);
      }
    });
  }

  toggleEdit(): void {
    this.editing = !this.editing;
    
    if (!this.editing && this.check) {
      // Reset form to original values if canceling edit
      this.loadCheck();
    }
  }

  onSubmit(): void {
    if (this.checkForm.invalid || !this.check) {
      return;
    }

    this.submitting = true;
    
    // Calculate final periodicity in minutes
    let periodicity = this.checkForm.value.periodicity;
    
    if (periodicity === 'custom') {
      const value = this.checkForm.value.customPeriodicityValue;
      const unit = this.checkForm.value.customPeriodicityUnit;
      
      switch (unit) {
        case 'minutes':
          periodicity = value;
          break;
        case 'hours':
          periodicity = value * 60;
          break;
        case 'days':
          periodicity = value * 1440;
          break;
        case 'weeks':
          periodicity = value * 10080;
          break;
      }
    }

    const updatedCheck = {
      name: this.checkForm.value.name,
      description: this.checkForm.value.description,
      periodicity: periodicity,
      notification_enabled: this.checkForm.value.notification_enabled
    };

    this.checkService.updateCheck(this.checkId, updatedCheck).subscribe({
      next: (response) => {
        this.submitting = false;
        this.editing = false;
        this.toastr.success('Check updated successfully!');
        
        // Refresh check data
        this.loadCheck();
      },
      error: (err) => {
        this.submitting = false;
        this.toastr.error('Failed to update check. Please try again.');
        console.error('Error updating check:', err);
      }
    });
  }

  recordCheck(): void {
    if (!this.check) return;
    
    this.checkService.recordCheck(this.checkId).subscribe({
      next: (response) => {
        if (this.check) {
          this.check.last_checked = response.checked_at;
        }
        this.toastr.success(`${this.check?.name} marked as completed!`);
      },
      error: (err) => {
        this.toastr.error('Failed to record check. Please try again.');
        console.error('Error recording check:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/checks']);
  }

  getLastCheckedString(): string {
    if (!this.check || !this.check.last_checked) {
      return 'Never';
    }
    
    const lastChecked = new Date(this.check.last_checked);
    const now = new Date();
    const minutesSince = Math.floor((now.getTime() - lastChecked.getTime()) / 60000);
    
    if (minutesSince < 1) {
      return 'Just now';
    } else if (minutesSince < 60) {
      return `${minutesSince} minute${minutesSince !== 1 ? 's' : ''} ago`;
    } else if (minutesSince < 1440) { // Less than a day
      const hours = Math.floor(minutesSince / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(minutesSince / 1440);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }

  getNextDueTime(): string {
    if (!this.check) {
      return 'Unknown';
    }
    
    if (!this.check.last_checked) {
      return 'Now';
    }
    
    const lastChecked = new Date(this.check.last_checked);
    const nextDue = new Date(lastChecked.getTime() + this.check.periodicity * 60000);
    const now = new Date();
    
    if (nextDue <= now) {
      return 'Now';
    }
    
    const minutesRemaining = Math.floor((nextDue.getTime() - now.getTime()) / 60000);
    
    if (minutesRemaining < 60) {
      return `${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`;
    } else if (minutesRemaining < 1440) { // Less than a day
      const hours = Math.floor(minutesRemaining / 60);
      const minutes = minutesRemaining % 60;
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes > 0 ? `${minutes} min` : ''}`;
    } else {
      const days = Math.floor(minutesRemaining / 1440);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  }

  isDue(): boolean {
    if (!this.check) {
      return false;
    }
    
    if (!this.check.last_checked) {
      return true;
    }
    
    const now = new Date();
    const lastChecked = new Date(this.check.last_checked);
    const minutesSinceLastCheck = (now.getTime() - lastChecked.getTime()) / (1000 * 60);
    
    return minutesSinceLastCheck >= this.check.periodicity;
  }

  getPeriodicityString(): string {
    if (!this.check) {
      return '';
    }
    
    const mins = this.check.periodicity;
    
    if (mins < 60) {
      return `${mins} minute${mins !== 1 ? 's' : ''}`;
    } else if (mins < 1440) {
      const hours = mins / 60;
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (mins < 10080) {
      const days = mins / 1440;
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else {
      const weeks = mins / 10080;
      return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    }
  }
}