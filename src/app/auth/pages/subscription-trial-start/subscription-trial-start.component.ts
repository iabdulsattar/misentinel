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

    const accessToken = this.authService.getAccessToken();
    if (accessToken) {
      this.loadUserAndTrial(accessToken);
    } else {
      this.loadTrialPlan();
    }
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

  startTrial(): void {
    if (!this.trialPlan) {
      this.errorMessage = 'Trial details are unavailable. Please try again.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const token = this.authService.getAccessToken();
    if (this.incomingRefreshToken) {
      this.exchangeTokenAndStartTrial(this.incomingRefreshToken);
      return;
    }

    if (!token || !this.orgId) {
      this.isLoading = false;
      this.errorMessage = 'Your session or organisation is unavailable. Please sign in again.';
      return;
    }

    this.startSubscriptionAndEnable(token);
  }

  private exchangeTokenAndStartTrial(refreshToken: string): void {
    this.authService.refresh({ refreshToken, serviceCode: this.serviceCode }).subscribe({
      next: (res) => {
        const accessToken = res?.access_token;
        if (!accessToken) {
          this.failExternalTrial('Unable to establish your session. Please try again.');
          return;
        }

        this.authService.setTokens(
          accessToken,
          res.refresh_token ?? refreshToken,
          String(Date.now() + 24 * 60 * 60 * 1000)
        );

        // Persist the refresh response before deciding anything, exactly as
        // the sign-in flow does, so the switcher and guards see the real state.
        localStorage.setItem('service_code', this.serviceCode);
        this.productSwitcherService.setSubscribedServices(res?.subscribedServices);
        this.permissionService.setServiceAccess(
          (res as any)?.serviceAccess ?? (res as any)?.tokens?.serviceAccess
        );

        const responseOrgs = res?.organizations ?? res?.tokens?.organizations ?? [];
        if (responseOrgs[0]?.id) {
          this.storeOrg(responseOrgs[0].id, responseOrgs[0].name);
        }

        if (this.productSwitcherService.isServiceSubscribed(this.serviceCode)) {
          this.incomingRefreshToken = null;
          this.router.navigate(['/']);
          return;
        }

        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { token: null, refreshToken: null },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });

        this.authService.getSession(accessToken).subscribe({
          next: (session) => {
            const organization = session?.organizations?.[0];
            if (!organization?.id) {
              this.failExternalTrial('No organisation is available for this account.');
              return;
            }

            const remember = localStorage.getItem('remember_device') === 'true';
            const storage = remember ? localStorage : sessionStorage;
            if (!this.orgId) {
              storage.setItem('org_id', organization.id);
              if (organization.name) {
                storage.setItem('org_name', organization.name);
              }
            }
            this.orgId = organization.id;
            this.orgName = organization.name || '';
            this.incomingRefreshToken = null;
            this.loadUserAndTrial(accessToken);
            this.startSubscriptionAndEnable(accessToken);
          },
          error: () => this.failExternalTrial('Unable to load your organisation. Please try again.')
        });
      },
      error: () => this.failExternalTrial('Unable to establish your session. Please try again.')
    });
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
        const services = JSON.parse(localStorage.getItem('subscribed_services') || '[]');
        const updatedServices = services.filter((service: any) => service.serviceCode !== this.serviceCode);
        updatedServices.push({ serviceCode: this.serviceCode, status: 'ACTIVE', active: true, trialActive: true });
        localStorage.setItem('subscribed_services', JSON.stringify(updatedServices));
        this.isLoading = false;
        this.router.navigate(['/subscription-trial-ready'], {
          queryParams: { serviceCode: this.serviceCode }
        });
      },
      error: (err) => {
        this.failExternalTrial(err?.error?.detail || 'Failed to enable the service. Please try again.');
      }
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
