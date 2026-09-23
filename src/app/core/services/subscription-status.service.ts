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

  clear(): void {
    this.status.set('unknown');
    this.isLoading.set(false);
  }

  isActive(): boolean {
    return this.status() === 'active' || this.status() === 'trial';
  }

  async refresh(): Promise<void> {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.clear();
      return;
    }

    this.isLoading.set(true);

    try {
      const result = await this.subscriptionService.checkSubscription(orgId, this.serviceCode).toPromise();
      const isTrial = result?.status === 'TRIAL' || result?.status === 'TRIALING';
      const active = result?.active === true || isTrial;
      const status = isTrial ? 'trial' : active ? 'active' : 'inactive';
      this.status.set(status);
    } catch (error) {
      this.status.set('inactive');
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
    return storage.getItem('org_id') || storage.getItem('organizationId') || null;
  }
}
