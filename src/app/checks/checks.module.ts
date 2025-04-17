// src/app/checks/checks.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { MatIconModule } from '@angular/material/icon';


// Components
import { CheckListComponent } from './check-list/check-list.component';
import { CheckCreateComponent } from './check-create/check-create.component';
import { CheckDetailComponent } from './check-detail/check-detail.component';

// Routing
import { ChecksRoutingModule } from './checks-routing.module';

// Services
import { CheckService } from './check.service';
@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule,
    ChecksRoutingModule,
    CheckListComponent,
    CheckCreateComponent,
    CheckDetailComponent,
    MatIconModule
  ],
  providers: [
    CheckService
  ]
})
export class ChecksModule { }
