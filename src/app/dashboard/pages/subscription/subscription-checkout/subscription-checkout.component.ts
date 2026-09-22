import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubscriptionService } from '../../../../core/services/subscription.service';
import { Plan, EdobQuote } from '../../../../core/models/subscription.models';
import { environment } from '../../../../../environments/environment';

declare global {
  interface Window {
    Stripe: any;
  }
}

interface OrderSummary {
  userLicenses: number;
  planName: string;
  subtotal: string;
  vat: string;
  total: string;
    nextBilling: string;
    recurring: string;
  }

@Component({
  selector: 'app-subscription-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './subscription-checkout.component.html',
})
export class SubscriptionCheckoutComponent implements OnInit, OnDestroy, AfterViewInit {
  billingForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  stripe: any = null;
  cardElement: any = null;
  cardErrors = '';
  cardExpiryErrors = '';
  cardCvcErrors = '';
  private viewReady = false;

  userCount = 256;
  plan: Plan | null = null;
  quote: EdobQuote | null = null;

  readonly steps = [
    { label: 'Plan & Users', hint: 'Select your plan and number of users', completed: true, current: false },
    { label: 'Payment', hint: 'Enter your billing and payment details', completed: false, current: true },
    { label: 'Confirmation', hint: 'Review and complete your subscription', completed: false, current: false },
  ];

  readonly countries = [
    { value: 'GB', label: 'United Kingdom' },
    { value: 'IE', label: 'Ireland' },
    { value: 'US', label: 'United States' },
  ];

  readonly footerLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Support', href: '#' },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private subscriptionService: SubscriptionService
  ) {
    this.billingForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      contactName: ['', Validators.required],
      billingEmail: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      postcode: ['', Validators.required],
      country: ['GB', Validators.required],
      cardHolderName: ['', Validators.required],
      sameAsCompany: [false],
      vatNumber: [''],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.userCount = Number(params['userCount']) || 256;
      this.loadPlanAndQuote();
    });

    this.loadStripe();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.initStripeIfReady();
  }

  ngOnDestroy(): void {
    if (this.cardElement) {
      this.cardElement.unmount();
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

  private loadPlanAndQuote(): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      console.error('[SubscriptionCheckout] No organization ID found');
      return;
    }

    this.subscriptionService.listPlans('edob').subscribe({
      next: (plans: Plan[]) => {
        this.plan = plans.find((p) => p.active) || plans[0] || null;
      },
      error: (err: any) => {
        console.error('[SubscriptionCheckout] Failed to load plans:', err);
        this.plan = null;
        this.errorMessage = 'Failed to load plan information. Please refresh the page or try again.';
      }
    });

    this.subscriptionService.getEdobQuote(orgId, this.userCount).subscribe({
      next: (q: EdobQuote) => {
        this.quote = q;
      },
      error: (err: any) => {
        console.error('[SubscriptionCheckout] Failed to load quote:', err);
        this.quote = null;
        this.errorMessage = this.errorMessage || 'Unable to load the billing quote. A fallback estimate will be used.';
      }
    });
  }

  get orderSummary(): OrderSummary {
    const currency = this.quote?.currency || 'GBP';

    const fmt = (cents: number) => `${currency === 'GBP' ? '£' : '$'}${cents.toFixed(2)}`;

    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    const nextBillingStr = nextBilling.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    return {
      userLicenses: this.userCount,
      planName: this.plan?.name || 'eDOB Subscription',
      subtotal: fmt(this.getPlanPrice()),
      vat: fmt(this.getVat()),
      total: fmt(this.getTotal()),
      nextBilling: nextBillingStr,
      recurring: 'Monthly',
    };
  }

  private getPlanPrice(): number {
    if (this.quote?.subtotalCents) return this.quote.subtotalCents / 100;
    if (this.plan?.monthlyGrossCents) return this.plan.monthlyGrossCents / 100;
    return this.priceForUsers(this.userCount);
  }

  private priceForUsers(n: number): number {
    if (n <= 250) return n * 5;
    if (n <= 500) return n * 2.5;
    return n * 1;
  }

  private getVat(): number {
    if (this.quote?.vatCents) return this.quote.vatCents / 100;
    return this.getPlanPrice() * 0.2;
  }

  private getTotal(): number {
    if (this.quote?.totalCents) return this.quote.totalCents / 100;
    return this.getPlanPrice() + this.getVat();
  }

  isBillingFieldInvalid(field: string): boolean {
    const control = this.billingForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  isPaymentFieldInvalid(field: string): boolean {
    const control = this.billingForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  private initStripeIfReady(): void {
    if (window.Stripe && this.viewReady && !this.stripe) {
      this.initStripe();
    }
  }

  loadStripe(): void {
    if (window.Stripe) {
      this.initStripeIfReady();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => this.initStripeIfReady();
    document.head.appendChild(script);
  }

  initStripe(): void {
    try {
      this.stripe = window.Stripe(environment.stripePublishableKey);

      const elements = this.stripe.elements({
        fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' }]
      });

      const style = {
        base: {
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          color: '#1e293b',
          '::placeholder': { color: '#94a3b8' }
        },
        invalid: { color: '#dc2626' }
      };

      const cardNumber = elements.create('cardNumber', {
        style,
        placeholder: '4242 4242 4242 4242',
        showIcon: true
      });
      const cardExpiry = elements.create('cardExpiry', { style, placeholder: 'MM / YY' });
      const cardCvc = elements.create('cardCvc', { style, placeholder: '123' });

      const cardNumberEl = document.getElementById('stripe-card-number');
      const cardExpiryEl = document.getElementById('stripe-card-expiry');
      const cardCvcEl = document.getElementById('stripe-card-cvc');

      if (cardNumberEl) cardNumber.mount(cardNumberEl);
      if (cardExpiryEl) cardExpiry.mount(cardExpiryEl);
      if (cardCvcEl) cardCvc.mount(cardCvcEl);

      cardNumber.on('change', (event: any) => {
        this.cardErrors = event.error ? event.error.message : '';
      });
      cardExpiry.on('change', (event: any) => {
        this.cardExpiryErrors = event.error ? event.error.message : '';
      });
      cardCvc.on('change', (event: any) => {
        this.cardCvcErrors = event.error ? event.error.message : '';
      });

      this.cardElement = { cardNumber, cardExpiry, cardCvc, unmount: () => {
        cardNumber.unmount();
        cardExpiry.unmount();
        cardCvc.unmount();
      }};
    } catch (e) {
      console.error('Stripe init error', e);
    }
  }

  onSubmit(): void {
    if (this.billingForm.invalid) {
      this.markFormGroupTouched(this.billingForm);
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    const orgId = this.getOrgId();
    if (!orgId || !this.plan?.id) {
      this.errorMessage = 'Missing organization or plan information. Please try again.';
      return;
    }

    if (!this.stripe || !this.cardElement) {
      this.errorMessage = 'Payment system is loading. Please wait a moment and try again.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cardErrors = '';

    const billingEmail = this.billingForm.get('billingEmail')?.value;
    const billingAddress = this.billingForm.get('addressLine1')?.value;
    const city = this.billingForm.get('city')?.value;
    const postcode = this.billingForm.get('postcode')?.value;
    const country = this.billingForm.get('country')?.value;
    const companyName = this.billingForm.get('companyName')?.value;
    const cardHolderName = this.billingForm.get('cardHolderName')?.value;

    const createPayment = () => {
      return this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardElement.cardNumber,
        billing_details: {
          name: cardHolderName,
          email: billingEmail,
          address: {
            line1: billingAddress,
            city,
            postal_code: postcode,
            country
          }
        }
      });
    };

    const subscribeToEdobCall = (paymentMethodId: string) => {
      return this.subscriptionService.subscribeToEdob(orgId, {
        userCount: this.userCount,
        billing: {
          companyName,
          contactName: cardHolderName,
          billingEmail,
          phone: this.billingForm.get('phoneNumber')?.value || '',
          addressLine1: billingAddress,
          addressLine2: this.billingForm.get('addressLine2')?.value || undefined,
          city,
          postcode,
          country
        },
        paymentMethodId
      });
    };

    const saveBillingInfoCall = () => {
      return this.subscriptionService.saveBillingInfo(orgId, {
        companyName,
        billingEmail,
        billingAddress,
        city,
        postcode,
        country,
        vatNumber: this.billingForm.get('vatNumber')?.value || undefined
      });
    };

    const handlePaymentResult = (result: any) => {
      if (result.error) {
        this.isLoading = false;
        this.errorMessage = result.error.message || 'Card validation failed. Please check your card details.';
      } else {
        subscribeToEdobCall(result.paymentMethod.id).subscribe({
          next: (response: any) => {
            if (response?.clientSecret) {
              this.stripe.confirmCardPayment(response.clientSecret, {
                payment_method: {
                  id: result.paymentMethod.id,
                  billing_details: {
                    name: cardHolderName,
                    email: billingEmail,
                    address: {
                      line1: billingAddress,
                      city,
                      postal_code: postcode,
                      country
                    }
                  }
                }
              }).then((confirmation: any) => {
                if (confirmation.error) {
                  this.isLoading = false;
                  this.errorMessage = confirmation.error.message || 'Additional payment authentication failed.';
                  return;
                }
                this.finishCheckout(orgId, saveBillingInfoCall);
              });
              return;
            }
            this.finishCheckout(orgId, saveBillingInfoCall);
          },
          error: (err: any) => {
            this.isLoading = false;
            this.errorMessage = err?.error?.message || err?.message || 'Payment failed. Please try again.';
          }
        });
      }
    };

    createPayment().then(handlePaymentResult).catch((err: any) => {
      this.isLoading = false;
      this.errorMessage = err?.message || 'Payment processing failed. Please try again.';
    });
  }

  private finishCheckout(orgId: string, saveBillingInfoCall: () => any): void {
    saveBillingInfoCall().subscribe({
      next: () => this.completeCheckout(orgId),
      error: () => this.completeCheckout(orgId)
    });
  }

  private completeCheckout(orgId: string): void {
    localStorage.setItem(`trial_started_${orgId}_edob`, 'true');
    const services: any[] = JSON.parse(localStorage.getItem('subscribed_services') || '[]') || [];
    if (!services.some((service: any) => service?.serviceCode === 'edob')) {
      services.push({ serviceCode: 'edob', planId: this.plan!.id, status: 'ACTIVE' });
      localStorage.setItem('subscribed_services', JSON.stringify(services));
    }
    this.isLoading = false;
    this.router.navigate(['/subscription']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }
}
