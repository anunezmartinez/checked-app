// src/app/core/core.module.ts
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';


// Services
import { NotificationService } from './notification.service';

@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule
  ],

  providers: [
    NotificationService
  ]
})
export class CoreModule {
  // Prevent reimporting of CoreModule
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only.');
    }
  }
}