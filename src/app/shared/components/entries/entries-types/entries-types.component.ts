import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EntryType, OrgUser, EntryStatus, EntryPriority } from '../../../../core/models/edob.models';
import type { EntriesFilter } from '../../../../dob-feed/entries.component';
import { SingleSelectComponent, SelectOption } from '../../form/single-select/single-select.component';

@Component({
  selector: 'app-entries-types',
  standalone: true,
  imports: [CommonModule, FormsModule, SingleSelectComponent],
  templateUrl: './entries-types.component.html',
})
export class EntriesTypesComponent {
  @Input() entryTypes: EntryType[] = [];
  @Input() orgUsers: OrgUser[] = [];
  @Input() statuses: { code: EntryStatus; label: string }[] = [];
  @Input() priorities: { code: EntryPriority; label: string }[] = [];
  @Input() filters!: EntriesFilter;

  @Output() filtersChange = new EventEmitter<EntriesFilter>();

  emit() {
    this.filtersChange.emit({ ...this.filters });
  }

  onStatusChange(value: string) {
    this.filters.status = value as EntryStatus | '';
    this.emit();
  }

  onPriorityChange(value: string) {
    this.filters.priority = value as EntryPriority | '';
    this.emit();
  }

  get typeOptions(): SelectOption[] {
    return [
      { value: '', label: 'All Types' },
      ...this.entryTypes.map((t) => ({ value: t.id, label: t.name })),
    ];
  }

  get statusOptions(): SelectOption[] {
    return [
      { value: '', label: 'All Statuses' },
      ...this.statuses.map((s) => ({ value: s.code, label: s.label })),
    ];
  }

  get priorityOptions(): SelectOption[] {
    return [
      { value: '', label: 'All Priorities' },
      ...this.priorities.map((p) => ({ value: p.code, label: p.label })),
    ];
  }

  get userOptions(): SelectOption[] {
    return [
      { value: '', label: 'All Users' },
      ...this.orgUsers.map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` })),
    ];
  }
}
