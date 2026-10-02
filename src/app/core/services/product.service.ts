import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface Product {
  id: string;
  name: string;
  description: string;
  serviceCode: string;
  baseUrl: string;
  planId?: string;
  icon: string;
  iconBg: string;
  status: 'available' | 'current' | 'coming-soon';
  actionLabel?: string;
  descriptionText?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private products: Product[] = [
    {
      id: 'edob',
      name: 'eDOB',
      description: 'Digital Occurrence Management',
      serviceCode: 'edob',
      baseUrl: 'https://sbsedob.workalert.uk',
      planId: '90c7dcff-f7d6-42c4-9b72-292d8f6e7793',
      icon: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
      iconBg: 'bg-blue-600',
      status: 'available',
    },
    {
      id: 'keyvault',
      name: 'KeyVault',
      description: 'Enterprise Key Management',
      serviceCode: 'key-vault',
      baseUrl: 'https://sbskeyvault.workalert.uk',
      planId: 'f28006cf-1174-4042-859a-8a3d2e78d60f',
      icon: '<path d="M12 3 5 6v5c0 4.500 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
      iconBg: 'bg-violet-700',
      status: 'available',
    },
  ];

  private currentProductId: string | null = null;

  constructor(private auth: AuthService) {}

  getProducts(): Product[] {
    return this.products;
  }

  getSubscribedServiceCodes(): string[] {
    const cached = localStorage.getItem('subscribed_services');
    if (!cached) return [];
    try {
      const parsed = JSON.parse(cached);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((s: any) => s?.serviceCode).filter(Boolean);
    } catch {
      return [];
    }
  }

  private getStoredServiceCode(): string | null {
    return localStorage.getItem('service_code') || sessionStorage.getItem('service_code') || null;
  }

  syncStatusesFromSubscriptions(serviceCode?: string): void {
    const active = serviceCode || this.getStoredServiceCode() || this.getCurrentServiceCode();
    const subscribed = this.getSubscribedServiceCodes();

    if (active && !this.currentProductId) {
      this.currentProductId = this.products.find(p => p.serviceCode === active)?.id ?? this.currentProductId;
    }

    this.products = this.products.map((p) => {
      const isCurrent = !!active && p.serviceCode === active;
      const isSubscribed = subscribed.includes(p.serviceCode);

      let status: Product['status'] = p.status;
      if (isCurrent) {
        status = 'current';
      } else if (isSubscribed) {
        status = 'available';
      } else if (p.status === 'current') {
        status = 'coming-soon';
      }

      return { ...p, status };
    });
  }

  getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  getProductByServiceCode(serviceCode: string): Product | undefined {
    return this.products.find(p => p.serviceCode === serviceCode);
  }

  setCurrentProduct(productId: string): void {
    this.currentProductId = productId;
  }

  getCurrentProduct(): Product | undefined {
    if (this.currentProductId) {
      return this.products.find(p => p.id === this.currentProductId);
    }
    return this.products.find(p => p.status === 'current');
  }

  getCurrentServiceCode(): string | null {
    const current = this.getCurrentProduct();
    return current?.serviceCode ?? null;
  }

  setCurrentProductByServiceCode(serviceCode: string): void {
    const product = this.products.find(p => p.serviceCode === serviceCode);
    if (product) {
      this.currentProductId = product.id;
      this.syncStatusesFromSubscriptions(serviceCode);
    }
  }
}