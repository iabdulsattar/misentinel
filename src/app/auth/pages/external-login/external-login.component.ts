import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ProductSwitcherService } from '../../../core/services/product-switcher.service';
import { PermissionService } from '../../../core/services/permission.service';

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
          this.routeAfterLogin(orgs[0].role);
        } else {
          this.authService.getSession(accessToken).subscribe({
            next: (session) => {
              const org = session?.organizations?.[0];
              if (org?.id) {
                this.storeOrg(org.id, org.name);
              }
              this.routeAfterLogin(org?.role);
            },
            error: () => this.routeAfterLogin()
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
  * Members go straight to the app. Administrators are routed by whether the
  * refresh response lists this service.
   */
  private routeAfterLogin(role?: string): void {
    const isAdmin = this.isAdminRole(role);

    console.log('[ExternalLogin] route decision:', {
      serviceCode: this.serviceCode,
      role,
      isOrgAdmin: isAdmin,
    });

    if (!isAdmin) {
      window.location.replace('/dashboard');
      return;
    }

    if (this.hasServiceInResponse()) {
      window.location.replace('/dashboard');
      return;
    }

    this.goToTrialStart();
  }

  private isAdminRole(role?: string): boolean {
    const normalizedRole = role?.trim().toUpperCase().replace(/[\s-]+/g, '_');
    return this.permissionService.isOrgAdmin()
      || ['ADMIN', 'ADMINISTRATOR', 'OWNER', 'ORG_ADMIN', 'ORGANIZATION_ADMIN'].includes(normalizedRole ?? '');
  }

  private goToTrialStart(): void {
    window.location.replace(
      `/subscription-trial-start?serviceCode=${encodeURIComponent(this.serviceCode)}`
    );
  }

  /** Route only when the refresh response includes this exact service. */
  private hasServiceInResponse(): boolean {
    const serviceCode = this.serviceCode.trim().toLowerCase();
    return Array.isArray(this.subscribedServices) && this.subscribedServices.some(
      (service) => String(service?.serviceCode ?? '').trim().toLowerCase() === serviceCode
    );
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
