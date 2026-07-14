import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface TableUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
  created: string;
  img: number;
  raw: any;
}

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-table.component.html',
})
export class UsersTableComponent {
  @Input() users: TableUser[] = [];
  @Input() loading = false;
  @Input() total = 0;
  @Input() page = 0;
  @Input() size = 10;
  @Input() showingText = '';

  @Output() rowClick = new EventEmitter<TableUser>();
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
