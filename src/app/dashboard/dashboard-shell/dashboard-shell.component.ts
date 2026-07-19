import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EdobService } from '../../core/services/edob.service';
import { PermissionService } from '../../core/services/permission.service';
import { ProfileResponse } from '../../core/models/auth.models';
import { DashboardData } from '../../core/models/edob.models';
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
  loading = true;
  dashboardError = false;

  // Each quick-entry card is gated by the permission needed to create that
  // entry type. Cards the user lacks permission for are hidden.
  readonly quickEntries = [
    {
      title: 'Basic Entry',
      description: 'Create a basic record',
      tab: 'basic',
      permission: 'entry.create',
      icon: this.icon(`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>`, '#111827', 18),
    },
    {
      title: 'Incident Entry',
      description: 'Report and record incidents',
      tab: 'incident',
      permission: 'entry.create',
      icon: this.icon(`<path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/>`, '#111827', 18),
    },
    {
      title: 'Handover Entry',
      description: 'Create and assign shift handovers',
      tab: 'handover',
      permission: 'entry.create',
      icon: this.icon(`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`, '#111827', 18),
    },
    {
      title: 'Follow-up Entry',
      description: 'Track and update follow-ups',
      tab: 'followup',
      permission: 'entry.create',
      icon: this.icon(`<path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z"/><rect x="4" y="4" width="16" height="18" rx="2"/><polyline points="8 13 11 16 16 10"/>`, '#111827', 18),
    },
  ];

  // Quick-entry cards the current user is permitted to use.
  get visibleQuickEntries() {
    return this.quickEntries.filter((e) => !e.permission || this.permissionService.hasPermission(e.permission));
  }

  get canViewEntries(): boolean {
    return this.permissionService.hasPermission('entry.view');
  }

  get hasAnyDashboardAccess(): boolean {
    return this.visibleQuickEntries.length > 0 || this.canViewEntries;
  }

  metrics: {
    value: string;
    label: string;
    change: string;
    positive: boolean;
    iconWrap: string;
    icon: string;
  }[] = [];

  recentEntries: {
    title: string;
    note: string;
    type: string;
    priority: string;
    status: string;
    initials: string;
    createdBy: string;
    time: string;
    typeClass: string;
    priorityClass: string;
    statusClass: string;
  }[] = [];

  criticalAlerts: {
    title: string;
    meta: string;
    dotClass: string;
  }[] = [];

  activeTypes: {
    name: string;
    count: number;
    percent: number;
    barClass: string;
    icon: string;
  }[] = [];

  snapshots: {
    label: string;
    value: string;
  }[] = [];

  constructor(
    private authService: AuthService,
    private edobService: EdobService,
    private permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    this.loadGreeting();
    this.loadDashboard();
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

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return (
      sessionStorage.getItem('org_id') ||
      sessionStorage.getItem('organizationId') ||
      localStorage.getItem('org_id') ||
      localStorage.getItem('organizationId') ||
      null
    );
  }

  private loadDashboard(): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.loading = false;
      this.dashboardError = true;
      return;
    }

    this.edobService.getDashboard(orgId).subscribe({
      next: (data: DashboardData) => {
        this.applyDashboard(data);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.dashboardError = true;
      }
    });
  }

  // Map the API payload into the view models. Falls back to sensible defaults
  // whenever a section is missing so the dashboard never renders blank.
  private applyDashboard(data: DashboardData): void {
    const counters = data.entriesCounters ?? {};

    // Top metric cards are derived from the entries counters.
    this.metrics = [
      {
        value: String(counters.totalEntries ?? 0),
        label: 'Total Entries',
        change: `${counters.open ?? 0} open`,
        positive: true,
        iconWrap: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
        icon: this.icon(`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>`, '#2563eb', 20),
      },
      {
        value: String(counters.open ?? 0),
        label: 'Open Entries',
        change: `${counters.inProgress ?? 0} in progress`,
        positive: true,
        iconWrap: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
        icon: this.icon(`<path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z"/><rect x="4" y="4" width="16" height="18" rx="2"/><polyline points="8 13 11 16 16 10"/>`, '#4f46e5', 20),
      },
      {
        value: String(counters.completed ?? 0),
        label: 'Completed',
        change: `${counters.completedThisMonth ?? 0} this month`,
        positive: true,
        iconWrap: 'bg-success-50 text-success-700',
        icon: this.icon(`<path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`, '#16a34a', 20),
      },
      {
        value: String(counters.cancelled ?? 0),
        label: 'Cancelled',
        change: 'All time',
        positive: false,
        iconWrap: 'bg-red-50 text-red-500 dark:bg-red-500/15',
        icon: this.icon(`<circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>`, '#dc2626', 20),
      },
    ];

    // Recent entries use the real payload (status/priority are enums).
    this.recentEntries = (data.recentEntries ?? []).map((e) => {
      const status = this.titleCase(e.status ?? 'NEW');
      const priority = this.titleCase(e.priority ?? 'NORMAL');
      return {
        title: e.title ?? 'Untitled entry',
        note: e.note ?? `#${e.entryNumber ?? ''}`.trim(),
        type: 'Entry',
        priority,
        status,
        initials: this.initials(e.createdBy ?? e.title ?? '?'),
        createdBy: e.createdBy ?? 'Unknown',
        time: this.formatTime(e.createdAt),
        typeClass: 'bg-brand-50 text-brand-600',
        priorityClass: this.priorityClass(e.priority),
        statusClass: this.statusClass(e.status),
      };
    });

    this.criticalAlerts = (data.criticalAlerts ?? []).map((a) => ({
      title: a.title ?? '',
      meta: a.meta ?? '',
      dotClass: a.dotClass ?? 'bg-error-500',
    }));

    // Most active types are derived from the counter's entryTypes breakdown.
    const entryTypes = (counters.entryTypes ?? []).filter((t) => (t.count ?? 0) > 0);
    const maxCount = entryTypes.reduce((m, t) => Math.max(m, t.count ?? 0), 0) || 1;
    this.activeTypes = (entryTypes.length ? entryTypes : counters.entryTypes ?? []).map((t) => ({
      name: t.name ?? '',
      count: Number(t.count ?? 0),
      percent: Math.round(((t.count ?? 0) / maxCount) * 100),
      barClass: 'bg-brand-500',
      icon: this.icon(`<path d="M7 3h7l4 4v14H7V3Zm7 0v5h4M10 12h5M10 16h7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`, 'currentColor', 18),
    }));

    // Activity snapshot mirrors the counter breakdown.
    this.snapshots = [
      { label: 'Total Entries', value: String(counters.totalEntries ?? 0) },
      { label: 'Open Entries', value: String(counters.open ?? 0) },
      { label: 'In Progress', value: String(counters.inProgress ?? 0) },
      { label: 'Completed', value: String(counters.completed ?? 0) },
    ];
  }

  private titleCase(value: string): string {
    return value
      .toLowerCase()
      .split(/[_\s]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private formatTime(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  private priorityClass(priority?: string): string {
    switch ((priority || '').toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-error-50 text-error-600';
      case 'MEDIUM':
        return 'bg-warning-50 text-warning-700';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  }

  private statusClass(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'COMPLETED':
      case 'CLOSED':
        return 'bg-success-50 text-success-700';
      case 'IN_PROGRESS':
      case 'ASSIGNED':
      case 'IN REVIEW':
        return 'bg-brand-50 text-brand-600';
      default:
        return 'bg-brand-50 text-brand-600';
    }
  }

  private icon(inner: string, stroke = 'currentColor', size = 24): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  }
}
