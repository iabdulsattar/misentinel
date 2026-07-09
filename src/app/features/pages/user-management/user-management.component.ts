import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface User {
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
export class UserManagementComponent {
  activeTab = 0;
  searchQuery = '';

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

  readonly users: User[] = [
    { name: 'Aisha Malik', email: 'aisha.malik@abscee.com', role: 'Supervisor', status: 'Active', invite: 'Accepted', inviteSub: '24 May 2025, 10:42 AM', lastLogin: '23 May 2025', lastTime: '08:42 AM', created: '15 Jan 2025', img: 47 },
    { name: 'Ravi Kumar', email: 'ravi.kumar@abscee.com', role: 'Supervisor', status: 'Active', invite: 'Pending', inviteSub: 'Invited on 23 May 2025', lastLogin: '23 May 2025', lastTime: '08:15 AM', created: '10 Jan 2025', img: 13 },
    { name: 'John Smith', email: 'john.smith@abscee.com', role: 'Security Officer', status: 'Active', invite: 'Accepted', inviteSub: '20 May 2025, 09:15 AM', lastLogin: '23 May 2025', lastTime: '07:30 AM', created: '05 Feb 2025', img: 14 },
    { name: 'Priya Sharma', email: 'priya.sharma@abscee.com', role: 'Security Officer', status: 'Active', invite: 'Expired', inviteSub: 'Expired on 21 May 2025', lastLogin: '22 May 2025', lastTime: '06:20 PM', created: '12 Feb 2025', img: 48, resend: true },
    { name: 'Michael Johnson', email: 'michael.johnson@abscee.com', role: 'Patrol Officer', status: 'Inactive', invite: 'Accepted', inviteSub: '18 May 2025, 06:50 PM', lastLogin: '18 May 2025', lastTime: '06:45 PM', created: '20 Mar 2025', img: 15 },
    { name: 'Neha Verma', email: 'neha.verma@abscee.com', role: 'Reviewer', status: 'Active', invite: 'Pending', inviteSub: 'Invited on 23 May 2025', lastLogin: '23 May 2025', lastTime: '08:10 AM', created: '18 Mar 2025', img: 49 },
    { name: 'David Wilson', email: 'david.wilson@abscee.com', role: 'Administrator', status: 'Active', invite: 'Accepted', inviteSub: '10 May 2025, 11:20 AM', lastLogin: '23 May 2025', lastTime: '07:05 AM', created: '02 Jan 2025', img: 33 },
    { name: 'Sneha Iyer', email: 'sneha.iyer@abscee.com', role: 'Patrol Officer', status: 'Inactive', invite: 'Not Invited', inviteSub: '-', lastLogin: '10 May 2025', lastTime: '11:15 AM', created: '28 Mar 2025', img: 44 },
  ];

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
