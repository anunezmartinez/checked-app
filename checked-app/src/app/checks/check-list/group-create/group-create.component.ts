import { Component, EventEmitter, Output } from '@angular/core';
import { MatFormField, MatLabel} from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-group-create',
  templateUrl: './group-create.component.html',
  standalone: true,
  imports: [MatFormField, MatLabel, FormsModule],
})
export class GroupCreateComponent {
  @Output() groupCreated = new EventEmitter<string>();
  groupName: string = '';

  createGroup() {
    const trimmed = this.groupName.trim();
    if (trimmed) {
      this.groupCreated.emit(trimmed);
      this.groupName = '';
    }
  }
}
