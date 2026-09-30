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

  /** The service this session runs, as persisted by login/refresh. */
  private get serviceCode(): string {
    return localStorage.getItem('service_code')
      || sessionStorage.getItem('service_code')
      || 'edob';
  }

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
        this.upsertSubscribedService({
          serviceCode: this.serviceCode,
          planId: result.planId,
          planCode: result.planCode,
          planName: result.planName,
          status: result.status,
          active: result.active,
          startDate: result.startDate,
          expiresAt: result.effectiveExpiry,
          trialActive: result.status === 'TRIAL' || result.status === 'TRIALING',
        });
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

  /**
   * Replace only this service's entry, keeping the others intact. Overwriting the
   * whole list here would drop the sibling services the product switcher relies
   * on to tell `current` from `active`.
   */
  private upsertSubscribedService(entry: Record<string, unknown>): void {
    let services: any[] = [];
    try {
      const stored = localStorage.getItem('subscribed_services');
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) {
        services = parsed;
      }
    } catch {
      services = [];
    }

    const next = services.filter((s) => s?.serviceCode !== entry['serviceCode']);
    next.push(entry);
    localStorage.setItem('subscribed_services', JSON.stringify(next));
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
