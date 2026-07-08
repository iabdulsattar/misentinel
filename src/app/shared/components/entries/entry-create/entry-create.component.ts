import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-entry-create',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './entry-create.component.html',
})
export class EntryCreateComponent {
  @Output() create = new EventEmitter<void>();

  constructor(private router: Router) {}

  onCreate() {
    this.create.emit();
    this.router.navigate(['/create-entry']);
  }
}
