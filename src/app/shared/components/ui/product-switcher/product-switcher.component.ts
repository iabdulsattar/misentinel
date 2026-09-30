import { Component, Input, Output, EventEmitter, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductSwitcherService, ProductConfig, ProductStatus } from '../../../../core/services/product-switcher.service';

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  serviceCode: string;
  icon: string;
  iconBg: string;
  status: ProductStatus;
  actionLabel?: string;
  actionHref?: string;
  descriptionText?: string;
}

@Component({
  selector: 'app-product-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-switcher.component.html',
})
export class ProductSwitcherComponent implements OnInit {
  private readonly productSwitcherService = inject(ProductSwitcherService);

  @Input() products: ProductItem[] = [];
  @Input() exploreAllHref: string = '#';
  @Output() productSelected = new EventEmitter<ProductItem>();

  showSwitcher = false;
  isSwitching = false;

  ngOnInit(): void {
    this.buildProducts();
    this.refreshProductStatuses();
  }

  private buildProducts(): void {
    if (this.products.length > 0) return;

    const configs = this.productSwitcherService.getAllProductConfigs();
    this.products = configs.map((config: ProductConfig) => ({
      id: config.id,
      name: config.name,
      description: config.id === 'edob' ? 'Digital Occurrence Management' : 'Enterprise Key Management',
      serviceCode: config.serviceCode,
      icon: config.id === 'edob'
        ? '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>'
        : '<path d="M12 3 5 6v5c0 4.500 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
      iconBg: config.id === 'edob' ? 'bg-blue-600' : 'bg-blue-600',
      status: 'available',
      actionLabel: config.id === 'edob' ? undefined : `Switch to ${config.name}`,
      descriptionText: config.id === 'edob' ? undefined : 'Securely register, issue, track and audit every key across your organisation.',
    }));
  }

  /** Statuses come from the persisted subscription list, not hardcoded ids. */
  private refreshProductStatuses(): void {
    const configs = this.productSwitcherService.getAllProductConfigs();
    this.products = this.products.map((product) => {
      const config = configs.find((item) => item.id === product.id);
      if (!config) return product;

      return { ...product, status: this.productSwitcherService.getProductStatus(config) };
    });
  }

  toggleSwitcher(event: MouseEvent): void {
    event.stopPropagation();
    this.refreshProductStatuses();
    this.showSwitcher = !this.showSwitcher;
  }

  async selectProduct(product: ProductItem): Promise<void> {
    // The current product is not switchable: no emit, no navigation.
    if (product.status === 'current' || this.isSwitching) {
      return;
    }

    this.productSelected.emit(product);
    this.isSwitching = true;
    this.showSwitcher = false;

    try {
      await this.productSwitcherService.switchToProduct(product.id);
    } catch (error: any) {
      console.error('Product switch failed:', error);
      this.isSwitching = false;
      const message = error?.message || error?.error?.detail || error?.error?.message || 'Unknown error';
      alert(`Failed to switch to ${product.name}: ${message}. Please try again.`);
    }
  }

  @HostListener('document:click')
  closeSwitcher(): void {
    this.showSwitcher = false;
  }
}