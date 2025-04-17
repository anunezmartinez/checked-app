// src/app/checks/check-create/check-create.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CheckService } from '../check.service';
import { ToastrService } from 'ngx-toastr';


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
  selector: 'app-check-create',
  templateUrl: './check-create.component.html',
  styleUrls: ['./check-create.component.scss'],
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
export class CheckCreateComponent implements OnInit {
  checkForm: FormGroup;
  loading = false;
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
    private checkService: CheckService,
    private router: Router,
    private toastr: ToastrService
  ) {
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
    // Initialize form logic
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

  onSubmit(): void {
    if (this.checkForm.invalid) {
      return;
    }

    this.loading = true;
    
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

    const check = {
      name: this.checkForm.value.name,
      description: this.checkForm.value.description,
      periodicity: periodicity,
      notification_enabled: this.checkForm.value.notification_enabled
    };

    this.checkService.createCheck(check).subscribe({
      next: (response) => {
        this.loading = false;
        this.toastr.success('Check created successfully!');
        this.router.navigate(['/checks']);
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error('Failed to create check. Please try again.');
        console.error('Error creating check:', err);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/checks']);
  }
}