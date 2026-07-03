import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-shell.component.html',
  styles: ''
})
export class DashboardShellComponent {
  readonly quickEntries = [
    {
      title: 'Basic Entry',
      description: 'Create a basic record',
      icon: this.icon('M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7M14 3v5h5M14 3l5 5M12 12v6M9 15h6'),
    },
    {
      title: 'Incident Entry',
      description: 'Report and record incidents',
      icon: this.icon('M12 2 4 6.5v9L12 22l8-6.5v-9L12 2Zm0 6v5M12 16h.01'),
    },
    {
      title: 'Handover Entry',
      description: 'Create and assign shift handovers',
      icon: this.icon('M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0M17 8h4M19 6v4'),
    },
    {
      title: 'Follow-up Entry',
      description: 'Track and update follow-ups',
      icon: this.icon('M8 4h8M9 2h6v4H9V2ZM6 5h12v16H6V5Zm4 9 2 2 4-5'),
    },
  ];

  readonly metrics = [
    {
      value: '24',
      label: 'Entries Today',
      change: '+ 12% vs yesterday',
      positive: true,
      iconWrap: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
      icon: this.icon('M7 3h7l4 4v14H7V3Zm7 0v5h4M10 12h5M10 16h7'),
    },
    {
      value: '2',
      label: 'Critical Entries',
      change: '+ 1 vs yesterday',
      positive: false,
      iconWrap: 'bg-error-50 text-error-500 dark:bg-error-500/15',
      icon: this.icon('M12 4 3.5 19h17L12 4Zm0 5v4M12 16.5h.01'),
    },
    {
      value: '96',
      label: 'Total Entries (This Week)',
      change: '+ 18% vs last week',
      positive: true,
      iconWrap: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
      icon: this.icon('M7 3h10v18H7V3Zm3 5h4M10 12h4M10 16h4'),
    },
    {
      value: '1h 24m',
      label: 'Avg. Response Time',
      change: '- 8% vs last week',
      positive: true,
      iconWrap: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400',
      icon: this.icon('M4 17 9 12l3 3 7-8M17 7h2v2'),
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
      icon: this.icon('M12 2 4 6.5v9L12 22l8-6.5v-9L12 2Zm0 6v5M12 16h.01', 18),
    },
    {
      name: 'Handover',
      count: 6,
      percent: 64,
      barClass: 'bg-brand-500',
      icon: this.icon('M7 3h10v18H7V3Zm3 5h4M10 12h4M10 16h4', 18),
    },
    {
      name: 'Follow-up',
      count: 4,
      percent: 40,
      barClass: 'bg-success-500',
      icon: this.icon('M8 4h8M9 2h6v4H9V2ZM6 5h12v16H6V5Zm4 9 2 2 4-5', 18),
    },
    {
      name: 'Basic',
      count: 3,
      percent: 24,
      barClass: 'bg-gray-500',
      icon: this.icon('M7 3h7l4 4v14H7V3Zm7 0v5h4M10 12h5M10 16h7', 18),
    },
  ];

  readonly snapshots = [
    { label: 'Total Entries', value: '142' },
    { label: 'Closed Entries', value: '118' },
    { label: 'Open Items', value: '24' },
    { label: 'Critical Items', value: '2' },
  ];

  private icon(path: string, size = 24): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${path}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
}



