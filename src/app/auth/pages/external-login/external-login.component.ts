import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  template: '<div class="flex items-center justify-center h-screen"><div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div></div>'
})
export class ExternalLoginComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  async ngOnInit(): Promise<void> {
    const refreshToken = this.route.snapshot.queryParamMap.get('token')
      || this.route.snapshot.queryParamMap.get('refreshToken');
    const serviceCode = this.route.snapshot.queryParamMap.get('serviceCode') || 'edob';

    if (!refreshToken) {
      console.error('[ExternalLogin] No refreshToken in URL');
      this.router.navigate(['/signin']);
      return;
    }

    try {
      console.log('[ExternalLogin] Exchanging token for service:', serviceCode);
      const res = await this.authService.refresh({ refreshToken, serviceCode }).toPromise();
      
      const accessToken = res?.access_token;
      const newRefreshToken = res?.refresh_token;
      
      if (!accessToken) {
        throw new Error('No access token in response');
      }

      this.authService.setTokens(accessToken, newRefreshToken ?? null, String(Date.now() + 24 * 60 * 60 * 1000));

      const session = await this.authService.getSession(accessToken).toPromise();
      const organization = session?.organizations?.[0];
      if (organization?.id) {
        const remember = localStorage.getItem('remember_device') === 'true';
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('org_id', organization.id);
        if (organization.name) {
          storage.setItem('org_name', organization.name);
        }
      }

      console.log('[ExternalLogin] Login successful, redirecting to dashboard');
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('[ExternalLogin] Failed:', error);
      this.router.navigate(['/signin']);
    }
  }

}