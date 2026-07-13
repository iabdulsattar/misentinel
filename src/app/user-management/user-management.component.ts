import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../core/services/user.service';

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
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-management.component.html',
  styles: ``
})
export class UserManagementComponent implements OnInit {
  activeTab = 0;
  searchQuery = '';
  loading = false;
  errorMessage = '';
  stats: any = null;
  users: User[] = [];

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

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadStats();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    const orgId = localStorage.getItem('org_id') || localStorage.getItem('organizationId') || '';
    if (!orgId) {
      this.loading = false;
      this.errorMessage = 'No organization selected yet.';
      return;
    }

    this.userService.listUsers(orgId, { page: 0, size: 10, q: this.searchQuery }).subscribe({
      next: (res) => {
        const payload = res?.data ?? res;
        const items = Array.isArray(payload) ? payload : payload?.content ?? payload?.items ?? [];
        this.users = items.map((item: any) => ({
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
          img: 40 + (this.users.length % 10),
          resend: item.invitationStatus === 'Pending',
        }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to load users right now.';
      },
    });
  }

  loadStats(): void {
    const orgId = localStorage.getItem('org_id') || localStorage.getItem('organizationId') || '';
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

  get filteredUsers(): User[] {
    if (!this.searchQuery.trim()) return this.users;
    const q = this.searchQuery.toLowerCase();
    return this.users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }

  setActiveTab(index: number): void {
    this.activeTab = index;
  }
}
