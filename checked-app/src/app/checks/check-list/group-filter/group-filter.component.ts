import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-group-filter',
  templateUrl: './group-filter.component.html',
  imports: [CommonModule, MatSelectModule, MatOptionModule],
})
export class GroupFilterComponent {
  @Input() groups: string[] = [];
  @Output() filterChange = new EventEmitter<string | null>();
  selectedGroup: string | null = null;

  onFilterChange() {
    this.filterChange.emit(this.selectedGroup);
  }
}
