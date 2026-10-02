import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductSwitcherService } from '../../../core/services/product-switcher.service';
import { PermissionService } from '../../../core/services/permission.service';
import { SubscriptionLayoutComponent } from '../../../layout/subscription-layout/subscription-layout.component';
import { Plan } from '../../../core/models/subscription.models';
import { CommonModule } from '@angular/common';
import { GridShapeComponent } from '../../../shared/components/common/grid-shape/grid-shape.component';

@Component({
  selector: 'app-subscription-trial-start',
  imports: [
    CommonModule,
    RouterModule,
    SubscriptionLayoutComponent,
    GridShapeComponent,
  ],
  templateUrl: './subscription-trial-start.component.html',
  styles: ''
})
export class SubscriptionTrialStartComponent implements OnInit {
  userName = '';
  userEmail = '';
  userRole = '';
  orgName = '';
  orgId: string | null = null;
  isLoading = false;
  errorMessage = '';
  trialPlan: Plan | null = null;
  serviceCode = 'edob';
  private incomingRefreshToken: string | null = null;

  constructor(
    private subscriptionService: SubscriptionService,
    private authService: AuthService,
    private productSwitcherService: ProductSwitcherService,
    private permissionService: PermissionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.serviceCode = this.route.snapshot.queryParamMap.get('serviceCode') || 'edob';
    this.incomingRefreshToken = this.route.snapshot.queryParamMap.get('token')
      || this.route.snapshot.queryParamMap.get('refreshToken');
    this.orgId = this.getOrgId();
    this.orgName = this.authService.getOrgName() || '';

    // External entry point: exchange the link's refresh token first so the
    // session and the subscription cache are real, then decide where to go.
    // The trial itself still only starts from the button click.
    if (this.incomingRefreshToken) {
      this.resolveFromRefreshToken(this.incomingRefreshToken, this.serviceCode);
      return;
    }

    const accessToken = this.authService.getAccessToken();
    if (accessToken) {
      if (this.productSwitcherService.isServiceSubscribed(this.serviceCode)) {
        window.location.replace('/dashboard');
        return;
      }
      this.isLoading = true;
      this.resolveOrgThenRender(accessToken);
    } else {
      this.loadTrialPlan();
    }
  }

  /**
   * Exchange the refresh token from the link and persist that response (tokens,
   * org, service access, subscribed services) exactly as the sign-in flow does.
   * A `subscribedServices`/`serviceAccess` entry for this serviceCode means the
   * org is already entitled, so the user goes straight to the dashboard;
   * anything else falls through to the trial page.
   */
  private resolveFromRefreshToken(refreshToken: string, serviceCode: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.refresh({ refreshToken, serviceCode }).subscribe({
      next: (res: any) => {
        const accessToken = res?.access_token ?? res?.tokens?.access_token;
        const newRefreshToken = res?.refresh_token ?? res?.tokens?.refresh_token;

        if (!accessToken) {
          this.isLoading = false;
          this.failExternalTrial('Unable to establish your session. Please try again.');
          return;
        }

        this.authService.setTokens(
          accessToken,
          newRefreshToken ?? refreshToken,
          String(Date.now() + 24 * 60 * 60 * 1000),
          serviceCode
        );

        localStorage.setItem('service_code', serviceCode);
        this.productSwitcherService.setSubscribedServices(
          res?.subscribedServices ?? res?.tokens?.subscribedServices
        );
        this.permissionService.setServiceAccess(
          res?.serviceAccess ?? res?.tokens?.serviceAccess
        );

        const orgs = res?.organizations ?? res?.tokens?.organizations ?? [];
        if (orgs[0]?.id) {
          this.storeOrg(orgs[0].id, orgs[0].name);
          this.orgId = orgs[0].id;
          this.orgName = orgs[0].name || this.orgName;
        }

        this.incomingRefreshToken = null;
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { token: null, refreshToken: null },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });

        const entitled = this.hasServiceInResponse(res, serviceCode);
        console.log('[ExternalLogin] serviceCode:', serviceCode,
          '| subscribedServices:', JSON.stringify(res?.subscribedServices),
          '| entitled:', entitled);

        // Already entitled to this service: boot the app straight on the
        // dashboard. A full navigation is used deliberately so no in-app guard
        // can bounce the user back onto this trial page.
        if (entitled) {
          this.isLoading = false;
          window.location.replace('/dashboard');
          return;
        }

        this.authService.getSession(accessToken).subscribe({
          next: (session) => {
            const organization = session?.organizations?.[0];
            if (organization?.id) {
              this.storeOrg(organization.id, organization.name);
              this.orgId = organization.id;
              this.orgName = organization.name || this.orgName;
            }
            this.resolveOrgThenRender(accessToken);
          },
          error: () => {
            this.isLoading = false;
            this.loadUserAndTrial(accessToken);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.failExternalTrial(
          err?.error?.detail || err?.error?.message || 'Unable to establish your session. Please try again.'
        );
      }
    });
  }

  /**
   * Ask the subscription service whether this org already has coverage for
   * `serviceCode`. An active trial counts as covered - `subscription: null`
   * only means there is no *paid* record on top of the trial, which is not a
   * reason to put the user back on the trial page.
   */
  private resolveOrgThenRender(accessToken: string): void {
    if (!this.orgId) {
      this.isLoading = false;
      this.loadUserAndTrial(accessToken);
      return;
    }

    this.subscriptionService.checkSubscription(this.orgId, this.serviceCode).subscribe({
      next: (check) => {
        const status = (check?.status || '').toUpperCase();
        const isTrial = status === 'TRIAL' || status === 'TRIALING';
        const active = check?.active === true || isTrial;

        console.log('[ExternalLogin] checkSubscription status:', check?.status,
          '| active:', check?.active,
          '| subscription:', JSON.stringify(check?.['subscription']));

        if (active) {
          this.cacheSubscription(check);
          this.isLoading = false;
          window.location.replace('/dashboard');
          return;
        }

        this.isLoading = false;
        this.loadUserAndTrial(accessToken);
      },
      error: () => {
        this.isLoading = false;
        this.loadUserAndTrial(accessToken);
      }
    });
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

  /** True when the refresh response already reports this service as active. */
  private hasServiceInResponse(res: any, serviceCode: string): boolean {
    const subscribed = res?.subscribedServices ?? res?.tokens?.subscribedServices ?? [];
    if (Array.isArray(subscribed)) {
      const match = subscribed.find((entry: any) => entry?.serviceCode === serviceCode);
      if (match) {
        return match.active !== false;
      }
    }

    const access = res?.serviceAccess ?? res?.tokens?.serviceAccess;
    if (Array.isArray(access)) {
      return access.some((grant: any) => grant?.serviceCode === serviceCode || grant?.wildcard === true);
    }
    if (access && typeof access === 'object') {
      return access?.serviceCode === serviceCode || access?.wildcard === true;
    }

    return this.productSwitcherService.isServiceSubscribed(serviceCode);
  }

  private loadUserAndTrial(token: string | null): void {
    if (token) {
      this.authService.me(token).subscribe({
        next: (profile: any) => {
          const user = profile?.user || profile?.data || profile;
          this.userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
          this.userEmail = user.email || '';
          this.userRole = this.extractRole(profile);
        },
        error: () => {
          this.userName = 'User';
        }
      });
    }

    this.loadTrialPlan();
  }

  private storeOrg(id: string, name?: string): void {
    const store = localStorage.getItem('remember_device') === 'true' ? localStorage : sessionStorage;
    store.setItem('org_id', id);
    store.setItem('organizationId', id);
    // Mirror into localStorage: guards and other consumers read it from there.
    localStorage.setItem('org_id', id);
    localStorage.setItem('organizationId', id);
    if (name) {
      store.setItem('org_name', name);
      store.setItem('organizationName', name);
      localStorage.setItem('org_name', name);
      localStorage.setItem('organizationName', name);
    }
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

  private extractRole(profile: any): string {
    const orgs = profile?.organizations || [];
    if (orgs.length > 0 && orgs[0].role) {
      return orgs[0].role;
    }
    const org = profile?.organization;
    if (org?.role) {
      return org.role;
    }
    return '';
  }

  private loadTrialPlan(): void {
    this.subscriptionService.listPlans(this.serviceCode).subscribe({
      next: (res: any) => {
        const planList = Array.isArray(res) ? res : (res?.data ?? []);
        this.trialPlan = planList.find((p: any) => p.trialEligible && p.active && (!p.serviceCode || p.serviceCode === this.serviceCode)) || null;
      },
      error: () => {
        this.errorMessage = 'Failed to load trial details. Please try again.';
      }
    });
  }

  /** Button handler: the trial only ever starts from this click. */
  startTrial(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const token = this.authService.getAccessToken();
    if (!token || !this.orgId) {
      this.isLoading = false;
      this.errorMessage = 'Your session or organisation is unavailable. Please sign in again.';
      return;
    }

    if (!this.trialPlan) {
      this.isLoading = false;
      this.errorMessage = 'Trial details are unavailable. Please try again.';
      return;
    }

    this.startSubscriptionAndEnable(token);
  }

  private startSubscriptionAndEnable(token: string): void {
    if (!this.orgId || !this.trialPlan) {
      this.failExternalTrial('Missing plan or organisation details. Please try again.');
      return;
    }

    this.subscriptionService.startSubscription(this.orgId, {
      planId: this.trialPlan.id,
      billingPeriod: 'MONTHLY',
      useTrial: true,
      config: {},
    }, this.serviceCode, token).subscribe({
      next: () => {
        this.enableTrialService(token);
      },
      error: (err) => {
        if (err?.status === 400 || err?.status === 409) {
          this.enableTrialService(token);
          return;
        }
        this.failExternalTrial(err?.error?.detail || 'Failed to start trial. Please try again.');
      }
    });
  }

  private enableTrialService(token: string): void {
    this.subscriptionService.enableService(this.orgId!, this.serviceCode, token).subscribe({
      next: () => {
        this.markServiceEnabledLocally();
        // The trial only grants permissions server-side, and those live on the
        // refresh response's `serviceAccess` block. Nothing else repopulates it
        // after the trial, so re-issue the refresh call to pick up the new grants
        // before the dashboard reads them.
        this.resyncAfterTrial();
      },
      error: (err) => {
        this.failExternalTrial(err?.error?.detail || 'Failed to enable the service. Please try again.');
      }
    });
  }

  /** Optimistic cache entry so the switcher/guards see the service right away. */
  private markServiceEnabledLocally(): void {
    const services = JSON.parse(localStorage.getItem('subscribed_services') || '[]')
      .filter((service: any) => service?.serviceCode !== this.serviceCode);

    services.push({ serviceCode: this.serviceCode, status: 'ACTIVE', active: true, trialActive: true });
    localStorage.setItem('subscribed_services', JSON.stringify(services));
  }

  /**
   * Exchange the stored refresh token again to load the post-trial grants.
   * The dashboard reads permissions from `service_access_saas`, which is only
   * written from a login/refresh response, so without this call the user lands
   * on the dashboard with no permissions at all.
   */
  private resyncAfterTrial(): void {
    const refreshToken = this.authService.getRefreshToken();
    if (!refreshToken) {
      this.goToTrialReady();
      return;
    }

    this.authService.refresh({ refreshToken, serviceCode: this.serviceCode }).subscribe({
      next: (res: any) => {
        const newAccessToken = res?.access_token ?? res?.tokens?.access_token;
        const newRefreshToken = res?.refresh_token ?? res?.tokens?.refresh_token;

        if (newAccessToken) {
          this.authService.setTokens(
            newAccessToken,
            newRefreshToken ?? refreshToken,
            String(Date.now() + 24 * 60 * 60 * 1000),
            this.serviceCode
          );
        }

        const serviceAccess = res?.serviceAccess ?? res?.tokens?.serviceAccess;
        if (serviceAccess) {
          this.permissionService.setServiceAccess(serviceAccess);
        }

        const subscribed = res?.subscribedServices ?? res?.tokens?.subscribedServices;
        if (Array.isArray(subscribed) && subscribed.length) {
          // The server list is authoritative for the sibling products, but if it
          // has not caught up with this trial yet, keep the optimistic entry
          // rather than dropping the service we just enabled.
          const hasThisService = subscribed.some(
            (entry: any) => entry?.serviceCode === this.serviceCode
          );
          this.productSwitcherService.setSubscribedServices(
            hasThisService ? subscribed : [...subscribed, {
              serviceCode: this.serviceCode,
              status: 'ACTIVE',
              active: true,
              trialActive: true
            }]
          );
        } else {
          // Refresh response carried no list; keep the optimistic entry.
          this.markServiceEnabledLocally();
        }

        console.log('[TrialStart] post-trial resync grants:',
          this.permissionService.getPermissions().length, 'permission(s)');

        this.goToTrialReady();
      },
      // Permissions stay as they are; the local cache is the fallback.
      error: () => this.goToTrialReady()
    });
  }

  private goToTrialReady(): void {
    this.isLoading = false;
    this.router.navigate(['/subscription-trial-ready'], {
      queryParams: { serviceCode: this.serviceCode }
    });
  }

  private failExternalTrial(message: string): void {
    this.isLoading = false;
    this.errorMessage = message;
  }

  get trialDays(): number {
    return this.trialPlan?.trialDays || 14;
  }

  get todayLabel(): string {
    return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  get trialEndLabel(): string {
    const end = new Date();
    end.setDate(end.getDate() + this.trialDays);
    return end.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
