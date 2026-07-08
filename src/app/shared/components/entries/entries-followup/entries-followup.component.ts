import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BadgeComponent } from '../../ui/badge/badge.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { TableEntry } from '../entries-table/entries-table.component';

@Component({
  selector: 'app-entries-followup',
  standalone: true,
  imports: [CommonModule, BadgeComponent, ButtonComponent],
  templateUrl: './entries-followup.component.html',
})
export class EntriesFollowupComponent {
  @Input() entry: TableEntry | null = null;
  @Output() edit = new EventEmitter<void>();

  formatDateTime(iso: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  onEdit() {
    this.edit.emit();
  }
}
