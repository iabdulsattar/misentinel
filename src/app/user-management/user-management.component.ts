import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../core/services/user.service';
import { SendInviteModalComponent } from './send-invite-modal/send-invite-modal.component';
import { DeactivateUserModalComponent } from './deactivate-user-modal/deactivate-user-modal.component';
import { ReactivateUserModalComponent } from './reactivate-user-modal/reactivate-user-modal.component';
import { UsersTableComponent, TableUser } from '../shared/components/users/users-table/users-table.component';

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
  imports: [CommonModule, FormsModule, RouterModule, SendInviteModalComponent, DeactivateUserModalComponent, ReactivateUserModalComponent, UsersTableComponent],
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
  detailUser: any = null;
  loadingDetail = false;
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
          this.currentPage = Number(this.meta.page);
          this.pageSize = Number(this.meta.size);
          this.totalElements = Number(this.meta.totalElements);
          this.totalPages = Number(this.meta.totalPages);
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

    if (total <= 9) {
      for (let i = 0; i < total; i++) pages.push(i);
      return pages;
    }

    pages.push(0);

    let start: number;
    let end: number;

    if (current <= 2) {
      start = 1;
      end = 4;
    } else if (current >= total - 3) {
      start = total - 5;
      end = total - 2;
    } else {
      start = current - 2;
      end = current + 2;
    }

    if (start > 1) {
      pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total - 2) {
      pages.push('...');
    }

    pages.push(total - 1);
    return pages;
  }

  get tableUsers(): TableUser[] {
    return this.users.map((u) => ({
      id: u.id || '',
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      lastLogin: u.lastLogin,
      created: u.created,
      img: u.img,
      raw: u,
    }));
  }

  get showingText(): string {
    if (this.totalElements === 0) return 'Showing 0 users';
    const start = this.startIndex;
    const end = this.endIndex;
    return `Showing ${start} to ${end} of ${this.totalElements} users`;
  }

  onTableRowClick(user: TableUser): void {
    const found = this.users.find((u) => u.id === user.id);
    if (found) this.selectUser(found);
  }

  onTablePageChange(page: number): void {
    this.goToPage(page);
  }

  onTableSearch(value: string): void {
    this.searchQuery = value;
    this.onSearch();
  }

  get detailName(): string {
    if (!this.detailUser) return this.selectedUser?.name || '';
    return [this.detailUser.firstName, this.detailUser.lastName].filter(Boolean).join(' ') || this.detailUser.name || this.selectedUser?.name || '';
  }

  get detailEmail(): string {
    return this.detailUser?.email || this.selectedUser?.email || '';
  }

  get detailRole(): string {
    return this.detailUser?.roleNames?.[0] || this.detailUser?.roleName || this.selectedUser?.role || 'Member';
  }

  get detailStatus(): string {
    const s = this.detailUser?.status || this.selectedUser?.status || 'Active';
    return s.toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
  }

  get detailPhone(): string {
    return this.detailUser?.phoneNumber || this.selectedUser?.phone || '';
  }

  get detailDepartment(): string {
    return this.detailUser?.department || this.selectedUser?.department || '';
  }

  get detailLocation(): string {
    return this.detailUser?.location || this.selectedUser?.location || '';
  }

  get detailEmployeeId(): string {
    return this.detailUser?.employeeId || this.selectedUser?.employeeId || '';
  }

  get detailJoined(): string {
    if (this.detailUser?.createdAt) return new Date(this.detailUser.createdAt).toLocaleString();
    return this.selectedUser?.joined || this.selectedUser?.created || '';
  }

  get detailLastLogin(): string {
    if (this.detailUser?.lastLoginAt) return new Date(this.detailUser.lastLoginAt).toLocaleString();
    return this.selectedUser?.lastLogin || '';
  }

  setActiveTab(index: number): void {
    this.activeTab = index;
  }

  selectUser(user: User): void {
    if (this.selectedUser?.id === user.id && this.showDetail) {
      this.showDetail = false;
      return;
    }

    this.selectedUser = user;
    this.showDetail = true;
    this.loadUserDetail(user);
  }

  private loadUserDetail(user: User): void {
    if (!user.id) return;
    this.loadingDetail = true;
    this.detailUser = null;

    const orgId = this.getOrgId();
    if (!orgId) {
      this.loadingDetail = false;
      this.detailUser = user;
      return;
    }

    this.userService.getUserDetail(orgId, user.id).subscribe({
      next: (res) => {
        this.detailUser = res;
        this.loadingDetail = false;
      },
      error: () => {
        this.loadingDetail = false;
        this.detailUser = user;
      }
    });
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
