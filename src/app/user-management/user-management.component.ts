import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../core/services/user.service';
import { SendInviteModalComponent } from './send-invite-modal/send-invite-modal.component';
import { DeactivateUserModalComponent } from './deactivate-user-modal/deactivate-user-modal.component';
import { ReactivateUserModalComponent } from './reactivate-user-modal/reactivate-user-modal.component';

interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  invite: 'Accepted' | 'Pending' | 'Expired' | 'Not Invited';
  inviteSub: string;
  lastLogin: string;
  lastTime: string;
  created: string;
  img: number;
  resend?: boolean;
  department?: string;
  phone?: string;
  location?: string;
  employeeId?: string;
  joined?: string;
}

interface PageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SendInviteModalComponent, DeactivateUserModalComponent, ReactivateUserModalComponent],
  templateUrl: './user-management.component.html',
  styles: ``
})
export class UserManagementComponent implements OnInit {
  activeTab = 0;
  searchQuery = '';
  private searchDebounce: any;
  loading = false;
  errorMessage = '';
  stats: any = null;
  users: User[] = [];
  selectedUser: User | null = null;
  showDetail = false;
  showInviteModal = false;
  showDeactivateModal = false;
  showReactivateModal = false;

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  meta: PageMeta | null = null;

  readonly tabs = [
    { label: 'Users' },
    { label: 'Roles' },
    { label: 'Permissions' },
    { label: 'Activity' },
  ];

  readonly roleStyles: Record<string, string> = {
    Supervisor: 'bg-blue-50 text-blue-700',
    'Security Officer': 'bg-purple-50 text-purple-700',
    'Patrol Officer': 'bg-sky-50 text-sky-700',
    Reviewer: 'bg-orange-50 text-orange-700',
    Administrator: 'bg-red-50 text-red-700',
  };

  readonly statusStyles: Record<string, string> = {
    Active: 'bg-green-50 text-green-700',
    Inactive: 'bg-slate-100 text-slate-600',
  };

  readonly invitationStyles: Record<string, { icon: string; color: string }> = {
    Accepted: { icon: 'ti-circle-check', color: 'text-green-600' },
    Pending: { icon: 'ti-clock', color: 'text-orange-500' },
    Expired: { icon: 'ti-alert-circle', color: 'text-red-500' },
    'Not Invited': { icon: 'ti-circle-minus', color: 'text-slate-400' },
  };

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadStats();
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId') || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    const orgId = this.getOrgId();
    if (!orgId) {
      this.loading = false;
      this.errorMessage = 'No organization selected yet.';
      return;
    }

    this.userService.listUsers(orgId, { page: this.currentPage, size: this.pageSize, q: this.searchQuery.trim() || undefined }).subscribe({
      next: (res) => {
        const payload = res?.data ?? res;
        const items = Array.isArray(payload) ? payload : payload?.content ?? payload?.items ?? [];
        this.users = items.map((item: any, index: number) => ({
          id: item.id,
          name: [item.firstName, item.lastName].filter(Boolean).join(' ') || item.name || item.email || 'Unknown',
          email: item.email || '-',
          role: item.roleName || item.role?.name || 'Member',
          status: (item.status || item.accountStatus || '').toLowerCase() === 'inactive' ? 'Inactive' : 'Active',
          invite: item.invitationStatus || 'Not Invited',
          inviteSub: item.invitationUpdatedAt ? new Date(item.invitationUpdatedAt).toLocaleString() : '-',
          lastLogin: item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString() : '-',
          lastTime: item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleTimeString() : '-',
          created: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-',
          img: 40 + (index % 10),
          resend: item.invitationStatus === 'Pending',
          department: ['Operations', 'Security', 'Compliance', 'HR'][index % 4],
          phone: ['+91 98765 43210', '+91 98765 12345', '+91 99456 12345', '+91 99876 00000'][index % 4],
          location: ['Head Office', 'North Gate', 'Control Room', 'Central Hub'][index % 4],
          employeeId: `EMP-${String(12 + index).padStart(5, '0')}`,
          joined: item.createdAt ? new Date(item.createdAt).toLocaleString() : '-',
        }));

        if (Array.isArray(payload)) {
          this.totalElements = this.users.length;
          this.totalPages = 1;
        } else {
          this.meta = {
            page: payload.page ?? this.currentPage,
            size: payload.size ?? this.pageSize,
            totalElements: payload.totalElements ?? this.users.length,
            totalPages: payload.totalPages ?? 1,
          };
          this.currentPage = this.meta.page;
          this.pageSize = this.meta.size;
          this.totalElements = this.meta.totalElements;
          this.totalPages = this.meta.totalPages;
        }

        this.selectedUser = this.selectedUser && this.users.some(user => user.email === this.selectedUser?.email)
          ? this.selectedUser
          : null;
        if (!this.selectedUser) {
          this.showDetail = false;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to load users right now.';
      },
    });
  }

  loadStats(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.userService.getStats(orgId).subscribe({
      next: (res) => {
        this.stats = res?.data ?? res;
      },
      error: () => {
        this.stats = null;
      },
    });
  }

  onSearch(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.currentPage = 0;
      this.loadUsers();
    }, 400);
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadUsers();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadUsers();
  }

  get startIndex(): number {
    if (this.totalElements === 0) return 0;
    return this.currentPage * this.pageSize + 1;
  }

  get endIndex(): number {
    if (this.totalElements === 0) return 0;
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  get pageNumbers(): (number | '...')[] {
    const pages: (number | '...')[] = [];
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      for (let i = 0; i < total; i++) pages.push(i);
      return pages;
    }

    pages.push(0);

    if (current > 3) {
      pages.push('...');
    }

    const start = Math.max(1, current - 1);
    const end = Math.min(total - 2, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 4) {
      pages.push('...');
    }

    pages.push(total - 1);
    return pages;
  }

  setActiveTab(index: number): void {
    this.activeTab = index;
  }

  selectUser(user: User): void {
    if (this.selectedUser?.email === user.email) {
      this.showDetail = !this.showDetail;
    } else {
      this.selectedUser = user;
      this.showDetail = true;
    }
  }

  closeDetail(): void {
    this.showDetail = false;
  }

  openInviteModal(): void {
    this.showInviteModal = true;
  }

  closeInviteModal(): void {
    this.showInviteModal = false;
  }

  onInviteSent(): void {
    this.showInviteModal = false;
    if (this.selectedUser) {
      this.selectedUser = { ...this.selectedUser, invite: 'Pending', inviteSub: new Date().toLocaleString() } as User;
    }
  }

  sendInvite(): void {
    if (!this.selectedUser?.id) return;
    const orgId = this.getOrgId();
    if (!orgId) return;
    this.userService.sendInvitation(orgId, this.selectedUser.id).subscribe({
      next: () => {
        this.onInviteSent();
      },
      error: () => {
        alert('Failed to send invitation.');
      }
    });
  }

  editUser(): void {
    if (!this.selectedUser?.id) return;
    this.router.navigate(['/users/add-user'], { queryParams: { id: this.selectedUser.id } });
  }

  openDeactivateModal(): void {
    this.showDeactivateModal = true;
  }

  closeDeactivateModal(): void {
    this.showDeactivateModal = false;
  }

  onUserDeactivated(): void {
    this.showDeactivateModal = false;
    if (this.selectedUser) {
      this.selectedUser = { ...this.selectedUser, status: 'Inactive' } as User;
    }
    this.loadUsers();
  }

  openReactivateModal(): void {
    this.showReactivateModal = true;
  }

  closeReactivateModal(): void {
    this.showReactivateModal = false;
  }

  onUserReactivated(): void {
    this.showReactivateModal = false;
    if (this.selectedUser) {
      this.selectedUser = { ...this.selectedUser, status: 'Active' } as User;
    }
    this.loadUsers();
  }
}
