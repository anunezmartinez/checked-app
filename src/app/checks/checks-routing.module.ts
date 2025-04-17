// src/app/checks/checks-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CheckListComponent } from './check-list/check-list.component';
import { CheckCreateComponent } from './check-create/check-create.component';
import { CheckDetailComponent } from './check-detail/check-detail.component';

const routes: Routes = [
  { path: '', component: CheckListComponent },
  { path: 'create', component: CheckCreateComponent },
  { path: ':id', component: CheckDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChecksRoutingModule { }
