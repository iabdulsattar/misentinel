import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Environment } from '../../../environments/environment.interface';

export interface ProductConfig {
  id: string;
  name: string;
  url: string;
  serviceCode: string;
}

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

  async switchToProduct(productId: string): Promise<void> {
    const config = this.getProductConfig(productId);
    if (!config) {
      throw new Error(`Unknown product: ${productId}`);
    }

    const refreshToken = this.authService.getRefreshToken();

    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    const targetUrl = `${config.url}external-login?token=${encodeURIComponent(refreshToken)}&serviceCode=${encodeURIComponent(config.serviceCode)}`;
    window.location.href = targetUrl;
  }
}