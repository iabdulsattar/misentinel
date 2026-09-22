import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { RangeSliderComponent } from '../../../shared/components/range-slider/range-slider.component';
import { SubscriptionService } from '../../../core/services/subscription.service';
import {
  EdobOverview,
  EdobInvoice as ApiInvoice,
  EdobInvoiceStats,
  EdobQuote,
  SubscriptionCheckResponse
} from '../../../core/models/subscription.models';

interface TickMilestone {
  value: number;
  percent: number;
  label: string;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  description: string;
  period: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  statusClass: string;
}

interface StatCard {
  iconBg: string;
  iconColor: string;
  icon: string;
  label: string;
  value: string;
  sub: string;
  subClass: string;
}

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RangeSliderComponent],
  templateUrl: './subscription.component.html',
  styles: []
})
export class SubscriptionComponent implements OnInit {
  @ViewChild(RangeSliderComponent) userSlider!: RangeSliderComponent;

  readonly min = 10;
  readonly max = 500;

   sliderValue = 256;
  fillPercent = 50;
  bubbleLeft = 50;
  estCost = '£640.00';

  activeTab: 'overview' | 'invoices' = 'overview';

  // API data
  overview: EdobOverview | null = null;
  quote: EdobQuote | null = null;
  invoiceStats: EdobInvoiceStats | null = null;
  invoices: Invoice[] = [];

  // Subscription check data
  subscriptionCheck: SubscriptionCheckResponse | null = null;
  subscriptionCheckLoading = false;

  // Pagination state
  currentPage = 1;
  totalInvoicesCount = 0;
  totalPages = 1;
  pageSize = 20;

  // Loading / error states
  overviewLoading = false;
  overviewError: string | null = null;
  invoicesLoading = false;
  invoicesError: string | null = null;

  readonly tickMilestones: TickMilestone[] = [
    { value: 10, percent: 0, label: '10' },
    { value: 100, percent: 18.37, label: '100' },
    { value: 200, percent: 38.78, label: '200' },
    { value: 300, percent: 59.18, label: '300' },
    { value: 400, percent: 79.59, label: '400' },
    { value: 500, percent: 100, label: '500' },
  ];

  plans = [
    { range: '10 – 250 users', price: '£5.00' },
    { range: '251 – 500 users', price: '£2.50' },
    { range: '501+ users', price: '£1.00' },
  ];

  statCards: StatCard[] = [
    {
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/></svg>`,
      label: 'Total Invoices',
      value: '12',
      sub: 'All time',
      subClass: 'text-slate-400 font-medium',
    },
    {
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>`,
      label: 'Paid Invoices',
      value: '9',
      sub: '£540.00',
      subClass: 'text-emerald-500 font-bold',
    },
    {
      iconBg: 'bg-yellow-50',
      iconColor: 'text-amber-500',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
      label: 'Pending Invoices',
      value: '2',
      sub: '£120.00',
      subClass: 'text-amber-500 font-bold',
    },
    {
      iconBg: 'bg-rose-50',
      iconColor: 'text-red-500',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>`,
      label: 'Overdue Invoices',
      value: '1',
      sub: '£60.00',
      subClass: 'text-red-500 font-bold',
    },
  ];

  readonly footerLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Support', href: '#' },
  ];

  private readonly priceFormatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  });

  private readonly dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  constructor(private subscriptionService: SubscriptionService) {}

  private getSubscribedServices(): any[] {
    try {
      const raw = localStorage.getItem('subscribed_services');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  get hasActiveSubscription(): boolean {
    // Use subscription check API if available, fallback to localStorage
    if (this.subscriptionCheck !== null) {
      return this.subscriptionCheck.active;
    }
    return this.getSubscribedServices().some(
      (s: any) => s?.serviceCode === 'edob'
    );
  }

  // Dynamic trial info from subscription check
  get trialInfo() {
    if (!this.subscriptionCheck?.features) return null;
    return this.subscriptionCheck.features;
  }

  ngOnInit(): void {
    console.log('[SubscriptionComponent] ngOnInit called');
    this.update();
    this.loadOverview();
    this.loadSubscriptionCheck();
  }

  private loadSubscriptionCheck(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.subscriptionCheckLoading = true;
    this.subscriptionService.checkSubscription(orgId, 'edob').subscribe({
      next: (data) => {
        this.subscriptionCheck = data;
        this.subscriptionCheckLoading = false;
      },
      error: () => {
        this.subscriptionCheckLoading = false;
      }
    });
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId') || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }

  loadOverview(): void {
    const orgId = this.getOrgId();
    console.log('[SubscriptionComponent] getOrgId() =>', orgId);
    if (!orgId) {
      this.overviewError = 'No organization selected. Please log in again.';
      return;
    }
    this.overviewLoading = true;
    this.overviewError = null;
    console.log('[SubscriptionComponent] Calling getEdobOverview for org:', orgId);
    this.subscriptionService.getEdobOverview(orgId, this.sliderValue)
      .pipe(finalize(() => (this.overviewLoading = false)))
      .subscribe({
        next: (data) => {
          this.overview = data;

          const userCount = data.quote?.userCount || data.usage?.userCount || this.sliderValue;
          this.sliderValue = Math.max(this.min, Math.min(this.max, userCount));
          this.update();

          if (data.tiers && data.tiers.length > 0) {
            this.plans = data.tiers.map((tier) => ({
              range: tier.label || (tier.maxUsers
                ? `${tier.minUsers} – ${tier.maxUsers} users`
                : `${tier.minUsers}+ users`),
              price: `£${((tier.perUserCents || tier.pricePerUserPence || 0) / 100).toFixed(2)}`,
            }));
          }

          if (data.quote) {
            this.quote = data.quote;
            this.estCost = data.quote.totalDisplay
              || this.centsToDisplay(data.quote.totalCents);
          } else {
            this.estCost = this.priceFormatter.format(this.priceForUsers(this.sliderValue));
          }
        },
        error: (err) => {
          this.overviewError = 'Failed to load subscription overview. See browser console for details.';
          console.error('[SubscriptionComponent] Overview API error:', err);
        },
      });
  }

   loadInvoices(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.invoicesLoading = true;
    this.invoicesError = null;

    this.subscriptionService.getEdobInvoiceStats(orgId)
      .pipe(finalize(() => (this.invoicesLoading = false)))
      .subscribe({
        next: (stats) => {
          this.invoiceStats = stats;
          this.updateStatCards(stats);
        },
        error: (err) => {
          this.invoicesError = 'Failed to load invoice data.';
          console.error('[SubscriptionComponent] Invoice stats error:', err);
        },
      });

    this.subscriptionService.listEdobInvoices(orgId, { page: this.currentPage - 1, size: this.pageSize })
      .subscribe({
        next: (res) => {
          this.invoices = (res.invoices || []).map((inv) => this.mapInvoice(inv));
          this.totalInvoicesCount = res.total || 0;
          this.totalPages = res.totalPages || 1;
          this.currentPage = (res.page ?? 0) + 1;
        },
        error: (err) => {
          console.error('[SubscriptionComponent] Invoice list error:', err);
          this.invoicesError = this.invoicesError || 'Failed to load invoices.';
        },
      });
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || this.invoicesLoading) return;
    this.currentPage = page;
    this.loadInvoices();
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalInvoicesCount);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  private updateStatCards(stats: EdobInvoiceStats | null): void {
    if (!stats) return;
    this.statCards = [
      {
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        icon: this.statCards[0]?.icon || '',
        label: 'Total Invoices',
        value: String(stats.totalInvoices ?? 0),
        sub: 'All time',
        subClass: 'text-slate-400 font-medium',
      },
      {
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        icon: this.statCards[1]?.icon || '',
        label: 'Paid Invoices',
        value: String(stats.paid ?? 0),
        sub: stats.totalAmountDisplay || '—',
        subClass: 'text-emerald-500 font-bold',
      },
       {
        iconBg: 'bg-yellow-50',
        iconColor: 'text-amber-500',
        icon: this.statCards[2]?.icon || '',
        label: 'Pending Invoices',
        value: String(stats.pending ?? 0),
        sub: stats.totalAmountDisplay || '—',
        subClass: 'text-amber-500 font-bold',
      },
      {
        iconBg: 'bg-rose-50',
        iconColor: 'text-red-500',
        icon: this.statCards[3]?.icon || '',
        label: 'Overdue Invoices',
        value: String(stats.overdue ?? 0),
        sub: '—',
        subClass: 'text-red-500 font-bold',
      },
    ];
  }

  private mapInvoice(inv: ApiInvoice): Invoice {
    const status = this.normalizeStatus(inv.status || '');
    const issueDate = inv.invoiceDate ? this.dateFormatter.format(new Date(inv.invoiceDate)) : '';
    const dueDate = inv.dueAt ? this.dateFormatter.format(new Date(inv.dueAt)) : '';
    const amount = inv.amountDisplay || this.centsToDisplay(inv.totalCents || 0);
    return {
      id: inv.id,
      number: inv.number || inv.id,
      date: issueDate,
      description: inv.description || 'eDOB Monthly Subscription',
      period: dueDate ? `Due ${dueDate}` : '',
      amount: amount,
      status,
      statusClass: this.statusBadgeClass(status),
    };
  }

  private normalizeStatus(status: string): 'Paid' | 'Pending' | 'Overdue' {
    const s = status.toLowerCase();
    if (s.includes('paid')) return 'Paid';
    if (s.includes('overdue')) return 'Overdue';
    if (s.includes('void')) return 'Paid';
    return 'Pending';
  }

  private statusBadgeClass(status: 'Paid' | 'Pending' | 'Overdue'): string {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-500 border-emerald-200';
      case 'Overdue':
        return 'bg-red-100 text-red-500 border-red-200';
      case 'Pending':
      default:
        return 'bg-amber-100 text-orange-400 border-amber-200';
    }
  }

  refreshQuote(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;
    console.log('[SubscriptionComponent] Calling getEdobQuote for org:', orgId, 'userCount:', this.sliderValue);
    this.subscriptionService.getEdobQuote(orgId, this.sliderValue)
      .subscribe({
        next: (q) => {
          this.quote = q;
          this.estCost = q.totalDisplay || this.priceFormatter.format(this.priceForUsers(this.sliderValue));
        },
        error: (err) => {
          console.error('[SubscriptionComponent] Quote API error:', err);
          this.estCost = this.priceFormatter.format(this.priceForUsers(this.sliderValue));
        },
      });
  }

  setActiveTab(tab: 'overview' | 'invoices'): void {
    this.activeTab = tab;
    if (tab === 'invoices' && !this.invoiceStats) {
      this.loadInvoices();
    }
  }

  private update(): void {
    const val = this.sliderValue;
    const pct = ((val - this.min) / (this.max - this.min)) * 100;
    this.fillPercent = pct;
    this.bubbleLeft = pct;
    this.estCost = this.quote?.totalDisplay || this.priceFormatter.format(this.priceForUsers(val));
  }

  private priceForUsers(n: number): number {
    if (n <= 250) return n * 5;
    if (n <= 500) return n * 2.5;
    return n * 1;
  }

  private centsToDisplay(cents: number): string {
    return this.priceFormatter.format(cents / 100);
  }

  isTickActive(milestone: TickMilestone): boolean {
    return milestone.percent <= this.fillPercent;
  }

  onSliderInput(): void {
    this.update();
    this.refreshQuote();
  }
}
