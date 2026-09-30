import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ProductSwitcherService } from '../../../core/services/product-switcher.service';
import { PermissionService } from '../../../core/services/permission.service';
import { SubscriptionService } from '../../../core/services/subscription.service';

@Component({
  selector: 'app-external-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50">
      <div class="bg-white rounded-xl shadow-sm p-8 max-w-md w-full mx-4 text-center">
        @if (error) {
          <svg class="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 class="mt-4 text-lg font-semibold text-slate-900">Unable to Sign In</h2>
          <p class="mt-2 text-slate-600">{{ error }}</p>
          <a routerLink="/signin" class="mt-6 inline-block text-blue-600 hover:underline">Go to Sign In</a>
        } @else {
          <div class="inline-block animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
          <p class="mt-4 text-slate-600">Signing you in...</p>
        }
      </div>
    </div>
  `
})
export class ExternalLoginComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly productSwitcherService = inject(ProductSwitcherService);
  private readonly permissionService = inject(PermissionService);
  private readonly subscriptionService = inject(SubscriptionService);

  error: string | null = null;
  private serviceCode = 'edob';
  private subscribedServices: any[] = [];

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const refreshToken = params.get('refreshToken') ?? params.get('token');
    this.serviceCode = params.get('serviceCode') || 'edob';

    if (!refreshToken) {
      this.error = 'Invalid link: missing refresh token.';
      return;
    }

    this.authService.refresh({ refreshToken, serviceCode: this.serviceCode }).subscribe({
      next: (res: any) => {
        // This endpoint nests the token pair under `tokens` (same shape as login).
        const accessToken = res?.access_token ?? res?.tokens?.access_token;
        const newRefreshToken = res?.refresh_token ?? res?.tokens?.refresh_token;

        if (!accessToken) {
          this.error = 'Unable to establish your session. Please try again.';
          return;
        }

        this.authService.setTokens(
          accessToken,
          newRefreshToken ?? refreshToken,
          String(Date.now() + 24 * 60 * 60 * 1000),
          this.serviceCode
        );

        localStorage.setItem('service_code', this.serviceCode);
        this.subscribedServices = res?.subscribedServices ?? res?.tokens?.subscribedServices ?? [];
        this.productSwitcherService.setSubscribedServices(this.subscribedServices);
        this.permissionService.setServiceAccess(
          res?.serviceAccess ?? res?.tokens?.serviceAccess
        );

        const orgs = res?.organizations ?? res?.tokens?.organizations ?? [];
        if (orgs[0]?.id) {
          this.storeOrg(orgs[0].id, orgs[0].name);
          this.routeAfterLogin(orgs[0].id);
        } else {
          this.authService.getSession(accessToken).subscribe({
            next: (session) => {
              const org = session?.organizations?.[0];
              if (org?.id) {
                this.storeOrg(org.id, org.name);
              }
              this.routeAfterLogin(org?.id ?? null);
            },
            error: () => this.routeAfterLogin(null)
          });
        }
      },
      error: (err) => {
        this.error = err?.error?.detail || err?.error?.message
          || 'Unable to establish your session. Please try again.';
      }
    });
  }

  /**
   * Subscribed (trial or paid) goes straight to the app. Anything else is sent
   * to the trial start page, where nothing happens until the user clicks
   * "Start Free Trial".
   */
  private routeAfterLogin(orgId: string | null): void {
    if (this.hasServiceInResponse()) {
      window.location.replace('/dashboard');
      return;
    }

    if (!orgId) {
      this.error = 'No organisation is available for this account.';
      return;
    }

    this.subscriptionService.checkSubscription(orgId, this.serviceCode).subscribe({
      next: (check) => {
        const status = (check?.status || '').toUpperCase();
        const active = check?.active === true || status === 'TRIAL' || status === 'TRIALING';

        if (active) {
          this.cacheSubscription(check);
          window.location.replace('/dashboard');
          return;
        }

        this.goToTrialStart();
      },
      error: () => this.goToTrialStart()
    });
  }

  private goToTrialStart(): void {
    window.location.replace(
      `/subscription-trial-start?serviceCode=${encodeURIComponent(this.serviceCode)}`
    );
  }

  /** The refresh response already lists this service as covered. */
  private hasServiceInResponse(): boolean {
    const subscribed = this.subscribedServices;
    if (Array.isArray(subscribed)) {
      const match = subscribed.find((entry: any) => entry?.serviceCode === this.serviceCode);
      if (match) {
        return match.active !== false;
      }
    }
    return this.productSwitcherService.isServiceSubscribed(this.serviceCode);
  }

  /** Keep the switcher/guard cache in step with the live check. */
  private cacheSubscription(check: any): void {
    if (!check?.planId) {
      return;
    }

    const services = JSON.parse(localStorage.getItem('subscribed_services') || '[]')
      .filter((s: any) => s?.serviceCode !== this.serviceCode);

    services.push({
      serviceCode: this.serviceCode,
      planId: check.planId,
      planCode: check.planCode,
      planName: check.planName,
      status: check.status,
      active: check.active,
      startDate: check.startDate,
      expiresAt: check.effectiveExpiry,
      trialActive: true
    });

    localStorage.setItem('subscribed_services', JSON.stringify(services));
  }

  private storeOrg(id: string, name?: string): void {
    const store = this.authService.isRemembered() ? localStorage : sessionStorage;
    store.setItem('org_id', id);
    store.setItem('organizationId', id);
    localStorage.setItem('org_id', id);
    localStorage.setItem('organizationId', id);
    if (name) {
      store.setItem('org_name', name);
      store.setItem('organizationName', name);
      localStorage.setItem('org_name', name);
      localStorage.setItem('organizationName', name);
    }
  }
}
