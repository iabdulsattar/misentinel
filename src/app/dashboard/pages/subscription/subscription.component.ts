import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RangeSliderComponent } from '../../../shared/components/range-slider/range-slider.component';

interface TickMilestone {
  value: number;
  percent: number;
  label: string;
}

interface Invoice {
  id: string;
  date: string;
  description: string;
  period: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  statusClass: string;
}

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RangeSliderComponent],
  templateUrl: './subscription.component.html',
  styles: [`
    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 9999px;
      background: linear-gradient(to right, #2563eb var(--fill, 50%), #e5e7eb var(--fill, 50%));
      outline: none;
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #2563eb;
      border: 4px solid #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
      cursor: pointer;
      margin-top: 0;
    }
    input[type="range"]::-moz-range-thumb {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #2563eb;
      border: 4px solid #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
      cursor: pointer;
    }
    input[type="range"]::-moz-range-track {
      height: 6px;
      border-radius: 9999px;
      background: #e5e7eb;
    }
  `]
})
export class SubscriptionComponent implements OnInit {
  @ViewChild('userSlider', { static: true }) userSlider!: ElementRef<HTMLInputElement>;

  readonly min = 10;
  readonly max = 500;

  sliderValue = 256;
  fillPercent = 50;
  bubbleLeft = 50;
  estCost = '£640.00';

  activeTab: 'overview' | 'invoices' = 'overview';

  readonly plans = [
    { range: '10 – 250 users', price: '£5.00' },
    { range: '251 – 500 users', price: '£2.50' },
    { range: '501+ users', price: '£1.00' },
  ];

  readonly tickMilestones: TickMilestone[] = [
    { value: 10, percent: 0, label: '10' },
    { value: 100, percent: 18.37, label: '100' },
    { value: 200, percent: 38.78, label: '200' },
    { value: 300, percent: 59.18, label: '300' },
    { value: 400, percent: 79.59, label: '400' },
    { value: 500, percent: 100, label: '500' },
  ];

  readonly invoices: Invoice[] = [
    {
      id: 'INV-2026-0012',
      date: '01 Sep 2026',
      description: 'eDOB Monthly Subscription',
      period: '01 Sep 2026 - 30 Sep 2026',
      amount: '£60.00',
      status: 'Pending',
      statusClass: 'bg-amber-100 text-orange-400 border-amber-200',
    },
    {
      id: 'INV-2026-0011',
      date: '01 Aug 2026',
      description: 'eDOB Monthly Subscription',
      period: '01 Aug 2026 - 31 Aug 2026',
      amount: '£60.00',
      status: 'Paid',
      statusClass: 'bg-emerald-50 text-emerald-500 border-emerald-200',
    },
    {
      id: 'INV-2026-0010',
      date: '01 Jul 2026',
      description: 'eDOB Monthly Subscription',
      period: '01 Jul 2026 - 31 Jul 2026',
      amount: '£60.00',
      status: 'Paid',
      statusClass: 'bg-emerald-50 text-emerald-500 border-emerald-200',
    },
    {
      id: 'INV-2026-0009',
      date: '01 Jun 2026',
      description: 'eDOB Monthly Subscription',
      period: '01 Jun 2026 - 30 Jun 2026',
      amount: '£60.00',
      status: 'Paid',
      statusClass: 'bg-emerald-50 text-emerald-500 border-emerald-200',
    },
    {
      id: 'INV-2026-0008',
      date: '01 May 2026',
      description: 'eDOB Monthly Subscription',
      period: '01 May 2026 - 31 May 2026',
      amount: '£60.00',
      status: 'Paid',
      statusClass: 'bg-emerald-50 text-emerald-500 border-emerald-200',
    },
    {
      id: 'INV-2026-0007',
      date: '01 Apr 2026',
      description: 'eDOB Monthly Subscription',
      period: '01 Apr 2026 - 30 Apr 2026',
      amount: '£60.00',
      status: 'Overdue',
      statusClass: 'bg-red-100 text-red-500 border-red-200',
    },
  ];

  readonly statCards = [
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

  ngOnInit(): void {
    this.update();
  }

  setActiveTab(tab: 'overview' | 'invoices'): void {
    this.activeTab = tab;
  }

  private update(): void {
    const val = this.sliderValue;
    const pct = ((val - this.min) / (this.max - this.min)) * 100;
    this.fillPercent = pct;
    this.bubbleLeft = pct;

    this.userSlider.nativeElement.style.setProperty('--fill', pct + '%');
    this.estCost = this.priceFormatter.format(this.priceForUsers(val));
  }

  private priceForUsers(n: number): number {
    if (n <= 250) return n * 5;
    if (n <= 500) return n * 2.5;
    return n * 1;
  }

  isTickActive(milestone: TickMilestone): boolean {
    return milestone.percent <= this.fillPercent;
  }

  onSliderInput(): void {
    this.update();
  }
}
