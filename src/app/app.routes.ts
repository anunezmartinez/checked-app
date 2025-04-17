// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
  { 
    path: 'auth', 
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) 
  },
  { 
    path: 'checks', 
    loadChildren: () => import('./checks/checks.module').then(m => m.ChecksModule),
    canActivate: [AuthGuard]
  },
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth' }
];