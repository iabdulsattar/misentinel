import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EdobService } from '../../core/services/edob.service';
import { PermissionService } from '../../core/services/permission.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { ProfileResponse } from '../../core/models/auth.models';
import { DashboardData, OrgUser } from '../../core/models/edob.models';
import { SubscriptionCheckResponse } from '../../core/models/subscription.models';
import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, SafeHtmlPipe],
  templateUrl: './dashboard-shell.component.html',
  styles: `
    @keyframes wave {
      0%, 100% { transform: rotate(0deg); }
      20% { transform: rotate(14deg); }
      40% { transform: rotate(-8deg); }
      60% { transform: rotate(14deg); }
      80% { transform: rotate(-4deg); }
    }
    .animate-wave {
      animation: wave 2.5s ease-in-out infinite;
      display: inline-block;
    }
  `
})
export class DashboardShellComponent implements OnInit {
  greeting = 'Good morning';
  userName = '';
  loading = true;
  dashboardError = false;
  orgUsers: OrgUser[] = [];

  // Subscription check data
  subscriptionCheck: SubscriptionCheckResponse | null = null;
  subscriptionLoading = false;

  // Each quick-entry card is gated by the permission needed to create that
  // entry type. Cards the user lacks permission for are hidden.
  readonly quickEntries = [
    {
      title: 'Basic Entry',
      description: 'Create a basic record',
      tab: 'basic',
      permission: 'entry.create',
      icon: this.icon(`<svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.4992 1.49939H4.49985C4.10206 1.49939 3.72057 1.65744 3.4393 1.93877C3.15802 2.22009 3 2.60166 3 2.99951V15.0005C3 15.3983 3.15802 15.7799 3.4393 16.0612C3.72057 16.3425 4.10206 16.5006 4.49985 16.5006H13.4989C13.8967 16.5006 14.2782 16.3425 14.5595 16.0612C14.8408 15.7799 14.9988 15.3983 14.9988 15.0005V5.99975M10.4992 1.49939C10.7366 1.49901 10.9718 1.5456 11.1911 1.63648C11.4104 1.72736 11.6096 1.86074 11.7771 2.02893L14.4679 4.72015C14.6365 4.88779 14.7702 5.08719 14.8613 5.30682C14.9525 5.52645 14.9992 5.76196 14.9988 5.99975M10.4992 1.49939V5.24969C10.4992 5.44862 10.5783 5.6394 10.7189 5.78006C10.8595 5.92072 11.0503 5.99975 11.2492 5.99975L14.9988 5.99975M6.74962 11.2502H11.2492M8.9994 13.5003V8.99999" stroke="#2563EB" stroke-width="2" stroke-linecap="round"/>
</svg>
`, '#111827', 18),
    },
    {
      title: 'Incident Entry',
      description: 'Report and record incidents',
      tab: 'incident',
      permission: 'entry.create',
      icon: this.icon(`<svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.0006 5.99975V8.99999M9.0006 12.0002H9.0081M16.5012 8.99999C16.5012 13.1425 13.1431 16.5006 9.0006 16.5006C4.85813 16.5006 1.5 13.1425 1.5 8.99999C1.5 4.85752 4.85813 1.49939 9.0006 1.49939C13.1431 1.49939 16.5012 4.85752 16.5012 8.99999Z" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round"/>
</svg>
`, '#111827', 18),
    },
    {
      title: 'Handover Entry',
      description: 'Create and assign shift handovers',
      tab: 'handover',
      permission: 'entry.create',
      icon: this.icon(`<svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.501 16.5006L16.5012 13.5003L13.501 10.5001M16.5012 13.5003H11.9699C11.4783 13.4953 10.9955 13.3696 10.5639 13.1342C10.1323 12.8987 9.76512 12.5609 9.49474 12.1502L9.22547 11.8127M13.501 7.49987L16.5012 4.49963L13.501 1.49939M16.5012 4.49963L12.0211 4.4997C11.5362 4.49639 11.0577 4.61066 10.6266 4.83273C10.1955 5.0548 9.82471 5.37806 9.54589 5.7748L5.45507 12.2253C5.17625 12.6221 4.80542 12.9453 4.37434 13.1674C3.94326 13.3895 3.46478 13.5037 2.97987 13.5004H1.5M1.5 4.4997H2.97912C3.53826 4.49581 4.08736 4.64825 4.56447 4.93982C5.04159 5.23139 5.42773 5.65049 5.67933 6.14983" stroke="#10B981" stroke-width="2" stroke-linecap="round"/>
</svg>
`, '#111827', 18),
    },
    {
      title: 'Follow-up Entry',
      description: 'Track and update follow-ups',
      tab: 'followup',
      permission: 'entry.create',
      icon: this.icon(`<svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.75 7.992V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V3.75C2.25 3.35218 2.40804 2.97064 2.68934 2.68934C2.97064 2.40804 3.35218 2.25 3.75 2.25H13.008M6.75 8.25L9 10.5L16.5 3" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
</svg>
`, '#111827', 18),
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

  get hasActiveSubscription(): boolean {
    // Use subscription check API if available, fallback to localStorage
    if (this.subscriptionCheck !== null) {
      // Show trial banner if status is TRIAL (trial subscription)
      if (this.subscriptionCheck.status === 'TRIAL') {
        return false;
      }
      return this.subscriptionCheck.active;
    }
    try {
      const raw = localStorage.getItem('subscribed_services');
      const services: any[] = raw ? JSON.parse(raw) : [];
      return services.some((s) => s?.serviceCode === 'edob');
    } catch {
      return false;
    }
  }

  // Dynamic trial info from overview (primary) or subscription check (fallback)
  get trialInfo() {
    // Prefer overview API data which has detailed trial info
    if (this.dashboardData?.trial) {
      const trial = this.dashboardData.trial;
      // Use subscription check for trial start date if available
      const trialStartDate = this.subscriptionCheck?.['startDate'] || trial.startedAt;
      const trialEndDate = trial.endsAt;
      // Calculate days remaining dynamically from end date
      const trialDaysRemaining = trialEndDate ? this.calculateDaysRemaining(trialEndDate) : trial.daysRemaining;
      return {
        trialStartDate,
        trialEndDate,
        trialDaysRemaining,
      };
    }
    // Fallback to subscription check
    if (this.subscriptionCheck) {
      const features = this.subscriptionCheck.features || {};
      const trialEndDate = this.subscriptionCheck['effectiveExpiry'] || features['trialEndDate'];
      // Calculate days remaining dynamically from end date
      const trialDaysRemaining = trialEndDate ? this.calculateDaysRemaining(trialEndDate) : features['trialDaysRemaining'];
      return {
        trialStartDate: this.subscriptionCheck['startDate'] || features['trialStartDate'],
        trialEndDate,
        trialDaysRemaining,
      };
    }
    return null;
  }

  // Calculate days remaining from end date (updates dynamically)
  private calculateDaysRemaining(endDate: string): number {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diffMs = end - now;
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  // Store dashboard data for trial info access
  dashboardData: any = null;

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
    private subscriptionService: SubscriptionService,
  ) {}

  ngOnInit(): void {
    this.loadGreeting();
    this.loadDashboard();
    this.loadSubscriptionCheck();
  }

  private loadSubscriptionCheck(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.subscriptionLoading = true;
    this.subscriptionService.checkSubscription(orgId, 'edob').subscribe({
      next: (data) => {
        this.subscriptionCheck = data;
        this.subscriptionLoading = false;
      },
      error: () => {
        this.subscriptionLoading = false;
      }
    });
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

    this.edobService.listOrgUsers(orgId).subscribe({
      next: (users: OrgUser[]) => {
        this.orgUsers = users;
      },
      error: () => {
        this.orgUsers = [];
      }
    });

    this.edobService.getDashboard(orgId).subscribe({
      next: (data: DashboardData) => {
        this.dashboardData = data;
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
        iconWrap: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
        icon: this.icon(`<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.33397 1.3328H4.00117C3.64758 1.3328 3.30848 1.47328 3.05845 1.72335C2.80843 1.97342 2.66797 2.31259 2.66797 2.66624V13.3338C2.66797 13.6874 2.80843 14.0266 3.05845 14.2766C3.30848 14.5267 3.64758 14.6672 4.00117 14.6672H12.0004C12.354 14.6672 12.6931 14.5267 12.9431 14.2766C13.1931 14.0266 13.3336 13.6874 13.3336 13.3338V5.33312M9.33397 1.3328C9.54498 1.33245 9.75398 1.37387 9.94893 1.45465C10.1439 1.53544 10.3209 1.65399 10.4699 1.8035L12.8616 4.19569C13.0115 4.34471 13.1304 4.52195 13.2114 4.71717C13.2924 4.9124 13.3339 5.12174 13.3336 5.33312M9.33397 1.3328V4.66639C9.33397 4.84322 9.4042 5.0128 9.52921 5.13784C9.65422 5.26287 9.82377 5.33311 10.0006 5.33311L13.3336 5.33312M6.66757 5.99983H5.33437M10.6672 8.66671H5.33437M10.6672 11.3336H5.33437" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"/>
</svg>
`, '#2563eb', 20),
      },
      {
        value: String(counters.open ?? 0),
        label: 'Open Entries',
        change: `${counters.inProgress ?? 0} in progress`,
        positive: true,
        iconWrap: 'bg-violet-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
        icon: this.icon(`<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.9987 9.3334L4.9987 7.40006C5.10741 7.18416 5.27278 7.00187 5.4771 6.8727C5.68143 6.74352 5.91703 6.67233 6.1587 6.66673H13.332M13.332 6.66673C13.5357 6.66637 13.7368 6.71269 13.9198 6.80212C14.1028 6.89155 14.2629 7.02172 14.3877 7.18264C14.5126 7.34356 14.599 7.53095 14.6402 7.73043C14.6813 7.92991 14.6763 8.13618 14.6254 8.3334L13.5987 12.3334C13.5244 12.6211 13.3562 12.8758 13.1206 13.0569C12.8851 13.2381 12.5958 13.3354 12.2987 13.3334H2.66536C2.31174 13.3334 1.9726 13.1929 1.72256 12.9429C1.47251 12.6928 1.33203 12.3537 1.33203 12.0001V3.3334C1.33203 2.97978 1.47251 2.64064 1.72256 2.39059C1.9726 2.14054 2.31174 2.00006 2.66536 2.00006H5.26536C5.48836 1.99788 5.70833 2.05166 5.90516 2.15648C6.10199 2.2613 6.26939 2.41381 6.39203 2.60006L6.93203 3.40006C7.05344 3.58442 7.21872 3.73574 7.41303 3.84047C7.60735 3.94519 7.82463 4.00003 8.04536 4.00006H11.9987C12.3523 4.00006 12.6915 4.14054 12.9415 4.39059C13.1916 4.64064 13.332 4.97978 13.332 5.3334V6.66673Z" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round"/>
</svg>
`, '#4f46e5', 20),
      },
      {
        value: String(counters.completed ?? 0),
        label: 'Completed',
        change: `${counters.completedThisMonth ?? 0} this month`,
        positive: true,
        iconWrap: 'bg-emerald-100 text-success-700',
        icon: this.icon(`<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_3731_679)">
<path d="M14.535 6.66681C14.8395 8.16101 14.6225 9.71443 13.9203 11.068C13.218 12.4216 12.073 13.4935 10.6761 14.105C9.27913 14.7165 7.71479 14.8307 6.24391 14.4284C4.77302 14.0261 3.4845 13.1317 2.59323 11.8944C1.70195 10.6571 1.26179 9.15164 1.34615 7.62907C1.43051 6.1065 2.0343 4.65887 3.05681 3.52759C4.07932 2.39631 5.45876 1.64977 6.96509 1.41245C8.47141 1.17513 10.0136 1.46139 11.3344 2.22348M6.0013 7.33316L8.0013 9.33316L14.668 2.66649" stroke="#10B981" stroke-width="2" stroke-linecap="round"/>
</g>
<defs>
<clipPath id="clip0_3731_679">
<rect width="16" height="16" fill="white"/>
</clipPath>
</defs>
</svg>
`, '#16a34a', 20),
      },
      {
        value: String(counters.cancelled ?? 0),
        label: 'Cancelled',
        change: 'All time',
        positive: false,
        iconWrap: 'bg-red-100 text-red-500 dark:bg-red-500/15',
        icon: this.icon(`<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.66736 5.66683L5.66704 9.66715M5.66704 5.66683L9.66736 9.66715M14.3344 7.66699C14.3344 11.3492 11.3494 14.3342 7.6672 14.3342C3.98501 14.3342 1 11.3492 1 7.66699C1 3.98479 3.98501 0.999786 7.6672 0.999786C11.3494 0.999786 14.3344 3.98479 14.3344 7.66699Z" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
</svg>
`, '#dc2626', 20),
      },
    ];

    // Recent entries use the real payload (status/priority are enums).
    const userMap = new Map(this.orgUsers.map(u => [u.id, `${u.firstName} ${u.lastName}`.trim()]));
    this.recentEntries = (data.recentEntries ?? []).map((e) => {
      const status = this.titleCase(e.status ?? 'NEW');
      const priority = this.titleCase(e.priority ?? 'NORMAL');
      const createdByName = e.createdBy || ((e as any)['createdByUserId'] ? userMap.get((e as any)['createdByUserId']) : undefined) || 'Unknown';
      return {
        title: e.title ?? 'Untitled entry',
        note: e.note ?? `#${e.entryNumber ?? ''}`.trim(),
        type: e.typeName || e.type || 'Entry',
        priority,
        status,
        initials: this.initials(createdByName),
        createdBy: createdByName,
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
