// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

const routes: Routes = [
  { 
    path: 'auth', 
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) 
  },
  { 
    path: 'checks', 
    loadChildren: () => import('./checks/checks.module').then(m => m.ChecksModule),
    canActivate: [AuthGuard]
  },
  { path: '', redirectTo: 'checks', pathMatch: 'full' },
  { path: '**', redirectTo: 'checks' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }