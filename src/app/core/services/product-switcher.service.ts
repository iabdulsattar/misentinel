import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Environment } from '../../../environments/environment.interface';
import { SERVICE_CODE } from './subscription.service';

export interface ProductConfig {
  id: string;
  name: string;
  url: string;
  serviceCode: string;
}

export type ProductStatus = 'current' | 'active' | 'available';

@Injectable({ providedIn: 'root' })
export class ProductSwitcherService {
  private readonly authService = inject(AuthService);

  private readonly productConfigs: Record<string, ProductConfig> = {
    edob: {
      id: 'edob',
      name: 'eDOB',
      url: (environment as Environment).productUrls.edob,
      serviceCode: 'edob'
    },
    keyvault: {
      id: 'keyvault',
      name: 'KeyVault Pro',
      url: (environment as Environment).productUrls.keyvault,
      serviceCode: 'key-vault'
    }
  };

  getProductConfig(productId: string): ProductConfig | undefined {
    return this.productConfigs[productId];
  }

  getAllProductConfigs(): ProductConfig[] {
    return Object.values(this.productConfigs);
  }

  /** The service code this browser session is currently running. */
  getCurrentServiceCode(): string {
    return localStorage.getItem('service_code') || sessionStorage.getItem('service_code') || SERVICE_CODE;
  }

  /**
   * Persist the subscribed-services list from a login/refresh response,
   * normalising the trial end date (`expiresAt` on /auth/refresh vs
   * `effectiveExpiry` elsewhere) so later checks agree.
   */
  setSubscribedServices(services: any[] | undefined): void {
    const list = Array.isArray(services) ? services : [];
    localStorage.setItem(
      'subscribed_services',
      JSON.stringify(
        list.map((s: any) => ({
          ...s,
          effectiveExpiry: this.getEntryExpiry(s) ?? s?.effectiveExpiry,
        }))
      )
    );
  }

  private getEntryExpiry(entry: any): string | null {
    return (
      entry?.effectiveExpiry ??
      entry?.expiresAt ??
      entry?.trialEnd ??
      entry?.trialEndsAt ??
      entry?.currentPeriodEnd ??
      null
    );
  }

  /** True when the org is genuinely subscribed to this service. */
  isServiceSubscribed(serviceCode: string): boolean {
    const entry = this.authService.getSubscribedService(serviceCode);
    if (!entry || entry.active === false) return false;

    const status = entry.status?.toUpperCase();
    if (status === 'CANCELLED' || status === 'EXPIRED' || status === 'INACTIVE') return false;

    const isTrial = entry.trialActive === true || entry.trial === true || status === 'TRIAL' || status === 'TRIALING';
    if (!isTrial) return true;

    const expiry = this.getEntryExpiry(entry);
    // No reported end date means the trial window is still open.
    return !expiry || new Date(expiry).getTime() > Date.now();
  }

  /**
   * Status shown in the switcher, derived from the `subscribedServices` the
   * identity service returns: the service this app runs is `current`, any other
   * service the org is subscribed to is `active`, and the rest are `available`.
   */
  getProductStatus(config: ProductConfig): ProductStatus {
    if (config.serviceCode === this.getCurrentServiceCode()) {
      return 'current';
    }
    return this.isServiceSubscribed(config.serviceCode) ? 'active' : 'available';
  }

  async switchToProduct(productId: string): Promise<void> {
    const config = this.getProductConfig(productId);
    if (!config) {
      throw new Error(`Unknown product: ${productId}`);
    }

    const refreshToken = this.authService.getRefreshToken();

    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    const targetUrl = `${config.url}/external-login?refreshToken=${encodeURIComponent(refreshToken)}&serviceCode=${encodeURIComponent(config.serviceCode)}`;
    window.location.href = targetUrl;
  }
}