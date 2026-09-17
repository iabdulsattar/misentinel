import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-subscription-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './subscription-checkout.component.html',
})
export class SubscriptionCheckoutComponent {
  billingForm: FormGroup;
  paymentForm: FormGroup;

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

  readonly orderSummary = {
    userLicenses: 10,
    subtotal: '£50.00',
    vat: '£10.00',
    total: '£60.00',
    nextBilling: '15 October 2026',
    recurring: '£60.00 / month',
  };

  readonly footerLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Support', href: '#' },
  ];

  constructor(private fb: FormBuilder) {
    this.billingForm = this.fb.group({
      companyName: ['ABC Security Ltd', Validators.required],
      contactName: ['Fiona Castor', Validators.required],
      billingEmail: ['FionaCastor@abcsecurity.co.uk', [Validators.required, Validators.email]],
      phoneNumber: ['+44 7700 900123'],
      addressLine1: ['Manchester Science Park', Validators.required],
      addressLine2: ['Building 3'],
      city: ['Manchester', Validators.required],
      postcode: ['M15 6SE', Validators.required],
      country: ['GB', Validators.required],
      sameAsCompany: [true],
    });

    this.paymentForm = this.fb.group({
      cardholderName: ['Fiona Castor', Validators.required],
      cardNumber: ['4242 4242 4242 4242', Validators.required],
      expiryDate: ['10 / 28', Validators.required],
      cvv: ['123', [Validators.required, Validators.minLength(3)]],
    });
  }

  isBillingFieldInvalid(field: string): boolean {
    const control = this.billingForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  isPaymentFieldInvalid(field: string): boolean {
    const control = this.paymentForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void {
    if (this.billingForm.valid && this.paymentForm.valid) {
      console.log('Billing:', this.billingForm.value);
      console.log('Payment:', this.paymentForm.value);
    }
  }
}
