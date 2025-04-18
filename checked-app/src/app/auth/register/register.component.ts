// src/app/auth/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';


// Import only the Material modules you actually use in this component
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
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
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/checks']);
    }

    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
  }

  // Validator for password match
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      formGroup.get('confirmPassword')?.setErrors(null);
    }
  }

  // Getter for easy access to form fields
  get f() { return this.registerForm.controls; }

  onSubmit(): void {
    // Stop here if form is invalid
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.register(
      this.f['email'].value,
      this.f['password'].value,
      this.f['name'].value
    ).subscribe({
      next: () => {
        this.toastr.success('Registration successful');
        
        // After successful registration, log the user in
        this.authService.login(this.f['email'].value, this.f['password'].value)
          .subscribe({
            next: () => {
              this.router.navigate(['/checks']);
            },
            error: (error: any) => {
              this.toastr.warning('Registration successful but automatic login failed. Please log in manually.');
              this.router.navigate(['/auth/login']);
              console.error('Login after registration error:', error);
            }
          });
      },
      error: (error: { error: { message: string | string[]; }; }) => {
        if (error?.error?.message?.includes('already exists')) {
          this.toastr.error('An account with this email already exists');
        } else {
          this.toastr.error('Registration failed. Please try again.');
        }
        this.loading = false;
        console.error('Registration error:', error);
      }
    });
  }
}