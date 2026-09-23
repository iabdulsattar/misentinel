import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SubscriptionService } from './subscription.service';

export type SubscriptionStatusValue = 'unknown' | 'active' | 'inactive' | 'trial';

@Injectable({ providedIn: 'root' })
export class SubscriptionStatusService {
  readonly status = signal<SubscriptionStatusValue>('unknown');
  readonly isLoading = signal(false);

  private readonly serviceCode = 'edob';

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly router: Router,
  ) {}

  isActive(): boolean {
    return this.status() === 'active';
  }

  async refresh(): Promise<void> {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.status.set('unknown');
      return;
    }

    this.isLoading.set(true);

    try {
      const result = await this.subscriptionService.checkSubscription(orgId, this.serviceCode).toPromise();
      const active = result?.active === true;
      const status = result?.status === 'TRIAL' ? 'trial' : active ? 'active' : 'inactive';

      this.status.set(status);

      if (active) {
        this.cacheActiveSubscription();
      } else {
        this.clearCachedSubscription();
      }
    } catch (error) {
      this.status.set('inactive');
      this.clearCachedSubscription();
    } finally {
      this.isLoading.set(false);
    }
  }

  markCheckoutSuccess(): void {
    this.status.set('active');
    this.cacheActiveSubscription();
  }

  redirectIfInactive(): void {
    if (this.status() === 'inactive' || this.status() === 'trial') {
      const currentUrl = this.router.url;
      if (!currentUrl.startsWith('/subscription') && !currentUrl.startsWith('/signin')) {
        this.router.navigate(['/subscription']);
      }
    }
  }

  private cacheActiveSubscription(): void {
    const services = JSON.parse(localStorage.getItem('subscribed_services') || '[]');
    const next = Array.isArray(services) ? [...services] : [];
    const index = next.findIndex((service: any) => service?.serviceCode === this.serviceCode);

    if (index >= 0) {
      next[index] = { ...next[index], serviceCode: this.serviceCode, status: 'ACTIVE' };
    } else {
      next.push({ serviceCode: this.serviceCode, status: 'ACTIVE' });
    }

    localStorage.setItem('subscribed_services', JSON.stringify(next));
  }

  private clearCachedSubscription(): void {
    const services = JSON.parse(localStorage.getItem('subscribed_services') || '[]');
    if (!Array.isArray(services)) {
      return;
    }

    const next = services.filter((service: any) => service?.serviceCode !== this.serviceCode);
    localStorage.setItem('subscribed_services', JSON.stringify(next));
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device') === 'true';
    const storage = remember ? localStorage : sessionStorage;
    return storage.getItem('org_id') || storage.getItem('organizationId') || null;
  }
}
