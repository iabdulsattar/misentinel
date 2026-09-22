import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { SubscriptionService } from '../../../../core/services/subscription.service';
import { EdobInvoiceDetail, EdobInvoiceLineItem } from '../../../../core/models/subscription.models';

interface InvoiceDetail {
  id: string;
  number: string;
  status: string;
  statusClass: string;
  description: string;
  issueDate: string;
  dueDate: string;
  dueIn: string;
  amountDue: string;
  items: {
    description: string;
    detail: string;
    quantity: string;
    unitPrice: string;
    amount: string;
  }[];
  subtotal: string;
  vat: string;
  totalDue: string;
  subscription: {
    title: string;
    userCount: string;
    userLabel: string;
    billingPeriod: string;
    unitPrice: string;
  };
  billingPeriod: string;
  cycle: string;
  userCount: string;
  nextBilling: string;
  planType: string;
  notes: string;
  companyName: string;
  billingEmail: string;
  billingAddress: string;
}

@Component({
  selector: 'app-invoice-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './invoice-details.component.html',
})
export class InvoiceDetailsComponent implements OnInit {
  invoice: InvoiceDetail | null = null;
  loading = true;
  notFound = false;
  error: string | null = null;

  private readonly priceFormatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  });

  private readonly dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  readonly footerLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Support', href: '#' },
  ];

  readonly tabs = [
    { label: 'Overview', value: 'overview', path: '/subscription' },
    { label: 'Invoices', value: 'invoices', path: '/subscription?tab=invoices' },
  ];

  constructor(
    private route: ActivatedRoute,
    private subscriptionService: SubscriptionService
  ) {}

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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound = true;
      this.loading = false;
      return;
    }

    const orgId = this.getOrgId();
    if (!orgId) {
      this.error = 'Unable to identify organization. Please log in again.';
      this.loading = false;
      return;
    }

    this.subscriptionService.getEdobInvoice(orgId, id).subscribe({
      next: (detail: EdobInvoiceDetail) => {
        this.invoice = this.mapInvoiceDetail(detail);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('[InvoiceDetails] Failed to load invoice:', err);
        if (err?.status === 404) {
          this.notFound = true;
        } else {
          this.error = 'Failed to load invoice details. Please try again.';
        }
        this.loading = false;
      }
    });
  }

  private centsToDisplay(cents: number): string {
    return this.priceFormatter.format(cents / 100);
  }

  private normalizeStatus(status: string): 'Paid' | 'Pending' | 'Overdue' {
    const s = status.toLowerCase();
    if (s.includes('paid')) return 'Paid';
    if (s.includes('overdue')) return 'Overdue';
    if (s.includes('void')) return 'Paid';
    return 'Pending';
  }

  private mapInvoiceDetail(detail: EdobInvoiceDetail): InvoiceDetail {
    const subtotalCents = detail.subtotalCents ?? detail.totalCents ?? 0;
    const vatCents = detail.vatCents ?? 0;
    const totalCents = detail.totalCents ?? subtotalCents + vatCents;
    const currency = detail.currency || 'GBP';
    const isGbp = currency === 'GBP';
    const symbol = isGbp ? '£' : '$';
    const fmtMoney = (cents: number) => `${symbol}${(cents / 100).toFixed(2)}`;

    const invoiceDate = detail.invoiceDate || detail.issueDate || '';
    const dueAt = detail.dueAt || detail.dueDate || '';
    const periodStart = detail.periodStart;
    const periodEnd = detail.periodEnd || detail.subscription?.currentPeriodEnd;

    const issueDate = invoiceDate
      ? this.dateFormatter.format(new Date(invoiceDate))
      : '—';
    const dueDate = dueAt ? this.dateFormatter.format(new Date(dueAt)) : '—';

    // Determine dueIn text
    let dueIn = '';
    if (dueAt) {
      const dueDateObj = new Date(dueAt);
      const today = new Date();
      const diffDays = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (detail.status === 'PAID' || detail.paymentStatus === 'PAID') {
        dueIn = 'Paid';
      } else if (diffDays > 0) {
        dueIn = `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
      } else if (diffDays === 0) {
        dueIn = 'Due today';
      } else {
        dueIn = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`;
      }
    }

    const billingPeriod = periodStart && periodEnd
      ? `${this.dateFormatter.format(new Date(periodStart))} – ${this.dateFormatter.format(new Date(periodEnd))}`
      : '—';

    // Use API-provided next billing date if available, otherwise compute
    let nextBilling = '';
    if (detail.subscription?.nextBillingDate) {
      nextBilling = this.dateFormatter.format(new Date(detail.subscription.nextBillingDate));
    } else if (periodEnd) {
      const nb = new Date(periodEnd);
      nb.setMonth(nb.getMonth() + 1);
      nextBilling = this.dateFormatter.format(nb);
    }

    // Build line items from API 'items' field
    let items: { description: string; detail: string; quantity: string; unitPrice: string; amount: string }[];
    if (detail.items && detail.items.length > 0) {
      items = detail.items.map((li: EdobInvoiceLineItem) => ({
        description: li.description || 'Item',
        detail: li.subDescription || li.detail || '',
        quantity: String(li.quantity ?? 1),
        unitPrice: li.unitPriceDisplay || this.centsToDisplay(li.unitPriceCents || li.unitPricePence || 0),
        amount: li.amountDisplay || this.centsToDisplay(li.amountCents || li.amountPence || 0),
      }));
    } else {
      // Fallback: build a single line item from invoice data
      const userLicences = detail.subscription?.userLicences || detail.subscription?.userCount || 0;
      const perUserCents = detail.subscription?.perUserCents
        ? detail.subscription.perUserCents
        : (userLicences > 0 ? Math.round(subtotalCents / userLicences) : subtotalCents);
      items = [{
        description: detail.description || 'eDOB Monthly Subscription',
        detail: billingPeriod !== '—' ? `Billing period: ${billingPeriod}` : '',
        quantity: String(userLicences || 1),
        unitPrice: this.centsToDisplay(perUserCents),
        amount: fmtMoney(subtotalCents),
      }];
    }

    // Status class
    let statusClass = 'bg-slate-100 text-slate-600 border-slate-200';
    if (detail.status === 'PAID' || detail.paymentStatus === 'PAID') {
      statusClass = 'bg-emerald-50 text-emerald-600 border-emerald-200';
    } else if (detail.status === 'OVERDUE' || detail.paymentStatus === 'OVERDUE') {
      statusClass = 'bg-rose-50 text-red-500 border-red-200';
    } else {
      statusClass = 'bg-amber-50 text-amber-600 border-amber-200';
    }

    // Billing info
    const billing = detail.billing || {};
    const companyName = billing.companyName || '—';
    const billingEmail = billing.billingEmail || '—';
    const billingAddress = billing.billingAddress || billing.address || '—';

    const userCount = detail.subscription?.userLicences || detail.subscription?.userCount || 0;
    const unitPricePerUser = userCount > 0
      ? this.centsToDisplay(detail.subscription?.perUserCents || Math.round(subtotalCents / userCount))
      : '—';

    const planType = detail.subscription?.planType
      || (detail.subscription?.planName ? `eDOB (${detail.subscription.planName})` : 'eDOB (Subscription)');

    return {
      id: detail.id,
      number: detail.number,
      status: this.normalizeStatus(detail.status || 'PENDING'),
      statusClass,
      description: detail.description || 'eDOB Monthly Subscription',
      issueDate: issueDate,
      dueDate: dueDate,
      dueIn,
      amountDue: fmtMoney(totalCents),
      items,
      subtotal: fmtMoney(subtotalCents),
      vat: fmtMoney(vatCents),
      totalDue: fmtMoney(totalCents),
      subscription: {
        title: detail.subscription?.title ?? detail.subscription?.planName ?? 'eDOB Subscription',
        userCount: String(userCount),
        userLabel: 'User Licenses',
        billingPeriod: detail.subscription?.billingCycle || detail.subscription?.billingPeriod || 'Monthly plan',
        unitPrice: `${unitPricePerUser} per user / month`,
      },
      billingPeriod,
      cycle: detail.subscription?.billingCycle || detail.subscription?.billingPeriod || 'Monthly',
      userCount: String(userCount),
      nextBilling: nextBilling || '—',
      planType,
      notes: detail.notes || 'This is a system generated invoice. For any queries, please contact our support team.',
      companyName,
      billingEmail,
      billingAddress,
    };
  }

  activeTabClass(value: string): string {
    return value === 'overview'
      ? 'pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 font-medium'
      : 'pb-3 border-b-2 border-blue-600 text-blue-600 font-medium';
  }

  formatAddress(address: string): string[] {
    return address.split('\n');
  }
}
