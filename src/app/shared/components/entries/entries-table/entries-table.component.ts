import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface TableEntry {
  id: string;
  entryId: string;
  type: string;
  typeCode: string;
  title: string;
  date: string;
  status: string;
  statusCode: string;
  priority: string;
  priorityCode: string;
  userName: string;
  userInitials: string;
  assignedTo: string;
  raw: any;
}

@Component({
  selector: 'app-entries-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entries-table.component.html',
})
export class EntriesTableComponent {
  @Input() entries: TableEntry[] = [];
  @Input() loading = false;
  @Input() total = 0;
  @Input() page = 0;
  @Input() size = 10;
  @Input() showingText = '';

  @Output() idClicked = new EventEmitter<TableEntry>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() searchChange = new EventEmitter<string>();

  searchTerm = '';

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.size));
  }

  get visiblePages(): (number | '...')[] {
    const pages: (number | '...')[] = [];
    const total = this.totalPages;
    if (total <= 7) {
      for (let i = 0; i < total; i++) pages.push(i);
      return pages;
    }
    pages.push(0);
    if (this.page > 2) pages.push('...');
    const start = Math.max(1, this.page - 1);
    const end = Math.min(total - 2, this.page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (this.page < total - 3) pages.push('...');
    pages.push(total - 1);
    return pages;
  }

  onIdClick(row: TableEntry) {
    this.idClicked.emit(row);
  }

  onSearchInput(value: string) {
    this.searchTerm = value;
    this.searchChange.emit(value);
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.pageChange.emit(page);
    }
  }
}
