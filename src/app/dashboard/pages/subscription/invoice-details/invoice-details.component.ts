import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

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

  private readonly priceFormatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  });

  private readonly mockInvoices: Record<string, InvoiceDetail> = {
    'INV-2026-0012': {
      id: 'INV-2026-0012',
      number: 'INV-2026-0012',
      status: 'Pending',
      statusClass: 'bg-orange-100 text-amber-600 border-amber-200',
      description: 'eDOB Monthly Subscription',
      issueDate: '01 Sep 2026',
      dueDate: '15 Sep 2026',
      dueIn: 'Due in 5 days',
      amountDue: '£60.00',
      items: [
        {
          description: 'eDOB User License',
          detail: 'Monthly subscription (01 Sep 2026 – 30 Sep 2026)',
          quantity: '10',
          unitPrice: '£5.00',
          amount: '£50.00',
        },
      ],
      subtotal: '£50.00',
      vat: '£10.00',
      totalDue: '£60.00',
      subscription: {
        title: 'eDOB Subscription',
        userCount: '10',
        userLabel: 'User Licenses',
        billingPeriod: 'Monthly plan',
        unitPrice: '£5.00 per user / month',
      },
      billingPeriod: '01 Sep 2026 – 30 Sep 2026',
      cycle: 'Monthly',
      userCount: '10',
      nextBilling: '01 Oct 2026',
      planType: 'eDOB (Subscription)',
      notes: 'This is a system generated invoice. For any queries, please contact our support team.',
      companyName: 'ABC Security Ltd',
      billingEmail: 'Fiona.Castor@abcsecurity.co.uk',
      billingAddress: 'Manchester Science Park\nBuilding 3\nManchester\nM15 6SE\nUnited Kingdom',
    },
  };

  readonly footerLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Support', href: '#' },
  ];

  readonly tabs = [
    { label: 'Overview', value: 'overview', path: '/subscription' },
    { label: 'Invoices', value: 'invoices', path: '/subscription?tab=invoices' },
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound = true;
      this.loading = false;
      return;
    }

    const mock = this.mockInvoices[id];
    if (mock) {
      this.invoice = mock;
      this.loading = false;
    } else {
      this.notFound = true;
      this.loading = false;
    }
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
