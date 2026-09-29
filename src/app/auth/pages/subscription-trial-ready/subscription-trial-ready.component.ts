import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SubscriptionLayoutComponent } from '../../../layout/subscription-layout/subscription-layout.component';
import { AuthService } from '../../../core/services/auth.service';
import { GridShapeComponent } from '../../../shared/components/common/grid-shape/grid-shape.component';

@Component({
  selector: 'app-subscription-trial-ready',
  imports: [
    CommonModule,
    RouterModule,
    SubscriptionLayoutComponent,
    GridShapeComponent
  ],
  templateUrl: './subscription-trial-ready.component.html',
  styles: ''
})
export class SubscriptionTrialReadyComponent implements OnInit {
  userName = '';
  userEmail = '';
  userRole = '';
  orgName = '';
  orgId: string | null = null;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.orgId = this.getOrgId();
    this.orgName = this.authService.getOrgName() || '';

    const refreshToken = this.authService.getRefreshToken();
    if (!refreshToken) {
      this.router.navigate(['/signin']);
      return;
    }

    const serviceCode = this.route.snapshot.queryParamMap.get('serviceCode') || 'edob';
    this.authService.refresh({ refreshToken, serviceCode }).subscribe({
      next: (res: any) => {
        // The identity service nests the tokens under `tokens` on this endpoint.
        const accessToken = res?.access_token ?? res?.tokens?.access_token;
        const newRefreshToken = res?.refresh_token ?? res?.tokens?.refresh_token;
        if (!accessToken) {
          this.router.navigate(['/signin']);
          return;
        }

        this.authService.setTokens(
          accessToken,
          newRefreshToken ?? refreshToken,
          String(Date.now() + 24 * 60 * 60 * 1000),
          serviceCode
        );
        localStorage.setItem('service_code', serviceCode);
        this.authService.me(accessToken).subscribe({
          next: (profile: any) => {
            const user = profile?.user || profile?.data || profile;
            this.userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
            this.userEmail = user.email || '';
            this.userRole = this.extractRole(profile);
            this.redirectToDashboard();
          },
          error: () => {
            this.userName = 'User';
            this.redirectToDashboard();
          }
        });
      },
      error: () => this.router.navigate(['/signin'])
    });
  }

  /** Hand the user on to the dashboard once the fresh session is in place. */
  private redirectToDashboard(): void {
    setTimeout(() => this.router.navigate(['/dashboard']), 2500);
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
}
