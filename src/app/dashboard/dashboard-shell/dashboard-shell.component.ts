import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileResponse } from '../../core/models/auth.models';
import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, SafeHtmlPipe],
  templateUrl: './dashboard-shell.component.html',
  styles: ''
})
export class DashboardShellComponent implements OnInit {
  greeting = 'Good morning';
  userName = '';

  readonly quickEntries = [
    {
      title: 'Basic Entry',
      description: 'Create a basic record',
      tab: 'basic',
      icon: this.icon(`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>`, '#111827', 18),
    },
    {
      title: 'Incident Entry',
      description: 'Report and record incidents',
      tab: 'incident',
      icon: this.icon(`<path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/>`, '#111827', 18),
    },
    {
      title: 'Handover Entry',
      description: 'Create and assign shift handovers',
      tab: 'handover',
      icon: this.icon(`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`, '#111827', 18),
    },
    {
      title: 'Follow-up Entry',
      description: 'Track and update follow-ups',
      tab: 'followup',
      icon: this.icon(`<path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z"/><rect x="4" y="4" width="16" height="18" rx="2"/><polyline points="8 13 11 16 16 10"/>`, '#111827', 18),
    },
  ];

  readonly metrics = [
    {
      value: '24',
      label: 'Entries Today',
      change: '↑ 12% vs yesterday',
      positive: true,
      iconWrap: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
      icon: this.icon(`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>`, '#2563eb', 20),
    },
    {
      value: '2',
      label: 'Critical Entries',
      change: '↓ 1 vs yesterday',
      positive: false,
      iconWrap: 'bg-red-50 text-red-500 dark:bg-red-500/15',
      icon: this.icon(`<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`, '#dc2626', 20),
    },
    {
      value: '96',
      label: 'Total Entries (This Week)',
      change: '↑ 18% vs last week',
      positive: true,
      iconWrap: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
      icon: this.icon(`<path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z"/><rect x="4" y="4" width="16" height="18" rx="2"/><polyline points="8 13 11 16 16 10"/>`, '#4f46e5', 20),
    },
    {
      value: '1h 24m',
      label: 'Avg. Response Time',
      change: '↓ 8% vs last week',
      positive: false,
      iconWrap: 'bg-[#f2f3ea] text-[#65682e] dark:bg-[#65682e]/15',
      icon: this.icon(`<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>`, '#65682e', 20),
    },
  ];

  readonly recentEntries = [
    {
      title: 'Unauthorized access attempt',
      note: 'Tailgating incident at Gate 2.',
      type: 'Incident',
      priority: 'High',
      status: 'In Review',
      initials: 'AM',
      createdBy: 'Aisha Malik',
      time: '08:42 AM',
      typeClass: 'bg-brand-50 text-brand-600',
      priorityClass: 'bg-error-50 text-error-600',
      statusClass: 'bg-brand-50 text-brand-600',
    },
    {
      title: 'Handover - Night Shift',
      note: 'Handover between night and morning shift.',
      type: 'Handover',
      priority: 'Medium',
      status: 'Completed',
      initials: 'JS',
      createdBy: 'John Smith',
      time: '07:30 AM',
      typeClass: 'bg-brand-50 text-brand-600',
      priorityClass: 'bg-warning-50 text-warning-700',
      statusClass: 'bg-success-50 text-success-700',
    },
    {
      title: 'Visitor follow-up',
      note: 'Follow up on visitor pass request.',
      type: 'Follow-up',
      priority: 'Low',
      status: 'Open',
      initials: 'RK',
      createdBy: 'Ravi Kumar',
      time: '09:15 AM',
      typeClass: 'bg-success-50 text-success-700',
      priorityClass: 'bg-gray-50 text-gray-600',
      statusClass: 'bg-brand-50 text-brand-600',
    },
  ];

  readonly criticalAlerts = [
    {
      title: 'Unauthorized access attempt',
      meta: 'Gate 2 · 08:42 AM',
      dotClass: 'bg-error-500',
    },
    {
      title: 'Fire extinguisher inspection due',
      meta: 'Building A · Overdue',
      dotClass: 'bg-warning-500',
    },
    {
      title: 'Patrol not completed',
      meta: 'Route 3 · Yesterday',
      dotClass: 'bg-error-500',
    },
  ];

  readonly activeTypes = [
    {
      name: 'Incident',
      count: 10,
      percent: 92,
      barClass: 'bg-[#7a5af8]',
      icon: this.icon(`<path d="M12 2 4 6.5v9L12 22l8-6.5v-9L12 2Zm0 6v5M12 16h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`, 'currentColor', 18),
    },
    {
      name: 'Handover',
      count: 6,
      percent: 64,
      barClass: 'bg-brand-500',
      icon: this.icon(`<path d="M7 3h10v18H7V3Zm3 5h4M10 12h4M10 16h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`, 'currentColor', 18),
    },
    {
      name: 'Follow-up',
      count: 4,
      percent: 40,
      barClass: 'bg-success-500',
      icon: this.icon(`<path d="M8 4h8M9 2h6v4H9V2ZM6 5h12v16H6V5Zm4 9 2 2 4-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`, 'currentColor', 18),
    },
    {
      name: 'Basic',
      count: 3,
      percent: 24,
      barClass: 'bg-gray-500',
      icon: this.icon(`<path d="M7 3h7l4 4v14H7V3Zm7 0v5h4M10 12h5M10 16h7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`, 'currentColor', 18),
    },
  ];

  readonly snapshots = [
    { label: 'Total Entries', value: '142' },
    { label: 'Closed Entries', value: '118' },
    { label: 'Open Items', value: '24' },
    { label: 'Critical Items', value: '2' },
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadGreeting();
  }

  private loadGreeting(): void {
    this.authService.me().subscribe({
      next: (profile: ProfileResponse) => {
        const hour = new Date().getHours();
        this.greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        this.userName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email || 'User';
      },
      error: () => {
        this.greeting = 'Good morning';
        this.userName = 'User';
      }
    });
  }

  private icon(inner: string, stroke = 'currentColor', size = 24): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  }
}



