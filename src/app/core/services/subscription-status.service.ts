import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SubscriptionService } from './subscription.service';
import { SubscriptionCheckResponse } from '../models/subscription.models';

export type SubscriptionStatusValue = 'unknown' | 'active' | 'inactive' | 'trial';

@Injectable({ providedIn: 'root' })
export class SubscriptionStatusService {
  readonly status = signal<SubscriptionStatusValue>('unknown');
  readonly isLoading = signal(false);
  readonly lastCheck = signal<SubscriptionCheckResponse | null>(null);

  private readonly serviceCode = 'edob';

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly router: Router,
  ) {}

  clear(): void {
    this.status.set('unknown');
    this.isLoading.set(false);
    this.lastCheck.set(null);
  }

  isActive(): boolean {
    return this.status() === 'active' || this.status() === 'trial';
  }

  async refresh(): Promise<SubscriptionCheckResponse | null> {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.clear();
      return null;
    }

    this.isLoading.set(true);

    try {
      const result = await this.subscriptionService.checkSubscription(orgId, this.serviceCode).toPromise();
      this.lastCheck.set(result ?? null);
      if (result?.planId) {
        localStorage.setItem('subscribed_services', JSON.stringify([{
          serviceCode: this.serviceCode,
          planId: result.planId,
          planCode: result.planCode,
          planName: result.planName,
          status: result.status,
          active: result.active,
          startDate: result.startDate,
          expiresAt: result.effectiveExpiry,
          trialActive: result.status === 'TRIAL' || result.status === 'TRIALING',
        }]));
      }
      const isTrial = result?.status === 'TRIAL' || result?.status === 'TRIALING';
      const active = result?.active === true || isTrial;
      const status = isTrial ? 'trial' : active ? 'active' : 'inactive';
      this.status.set(status);
      return result ?? null;
    } catch (error) {
      this.status.set('inactive');
      this.lastCheck.set(null);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  markCheckoutSuccess(): void {
    this.status.set('active');
  }

  redirectIfInactive(): void {
    if (this.status() === 'inactive') {
      const currentUrl = this.router.url;
      if (!currentUrl.startsWith('/subscription') && !currentUrl.startsWith('/signin')) {
        this.router.navigate(['/subscription']);
      }
    }
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device') === 'true';
    const storage = remember ? localStorage : sessionStorage;
    return storage.getItem('org_id') || storage.getItem('organizationId') ||
      localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }
}
