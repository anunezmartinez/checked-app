// src/app/material/material.module.ts
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NgModule } from '@angular/core';

@NgModule({
  exports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class MaterialModule {}
