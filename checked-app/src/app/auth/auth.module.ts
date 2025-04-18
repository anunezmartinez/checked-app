// src/app/auth/auth.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../material/material.module';

// Components
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

// Routing
import { AuthRoutingModule } from './auth-routing.module';

// Services and Guards
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AuthRoutingModule,
    LoginComponent,
    RegisterComponent,
    MaterialModule
  ],
  providers: [
    AuthService,
    AuthGuard
  ]
})
export class AuthModule { }