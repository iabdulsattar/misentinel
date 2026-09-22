// -------- Plans --------
export interface Plan {
  id: string;
  code: string;
  name: string;
  description?: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  currency: string;
  trialEligible: boolean;
  trialDays?: number;
  features: Record<string, any>;
  active: boolean;
  sortOrder: number;
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  monthlyGrossCents?: number;
  monthlyVatCents?: number;
  annualGrossCents?: number;
  annualVatCents?: number;
  vatRateBps?: number;
  serviceCode?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreatePlanRequest {
  code: string;
  name: string;
  description?: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  currency?: string;
  trialEligible?: boolean;
  trialDays?: number;
  features?: Record<string, any>;
  active?: boolean;
  sortOrder?: number;
}

// -------- Subscriptions --------
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'CANCELLED' | 'TRIALING' | 'PAST_DUE';
export type BillingPeriod = 'MONTHLY' | 'ANNUAL';

export interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  planCode?: string;
  planName?: string;
  status: SubscriptionStatus;
  billingPeriod: BillingPeriod;
  trialEnd?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  startDate: string;
  endDate?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface StartSubscriptionRequest {
  planId: string;
  billingPeriod: BillingPeriod;
  useTrial?: boolean;
  paymentMethodId?: string;
  config?: Record<string, any>;
  [key: string]: any;
}

export interface StartSubscriptionResponse {
  subscription: Subscription;
  [key: string]: any;
}

export interface ChangePlanRequest {
  newPlanId: string;
  billingPeriod: BillingPeriod;
  config?: Record<string, any>;
  paymentMethodId?: string;
  [key: string]: any;
}

export interface ChangePlanResponse {
  subscription: Subscription;
  [key: string]: any;
}

export interface CancelSubscriptionRequest {
  cancelAtPeriodEnd: boolean;
  reason?: string;
}

export interface CancelSubscriptionResponse {
  subscription: Subscription;
  [key: string]: any;
}

export interface ListSubscriptionsResponse {
  subscriptions: Subscription[];
  [key: string]: any;
}

export interface SubscriptionHistoryResponse {
  subscriptions: Subscription[];
  total: number;
  [key: string]: any;
}

// -------- Subscription Check (gating) --------
export interface SubscriptionCheckResponse {
  active: boolean;
  status?: string;
  planCode?: string;
  planName?: string;
  serviceCode?: string;
  features: Record<string, any>;
  [key: string]: any;
}

// -------- eDOB Subscription (per-seat) --------
export type BillingPeriodExtended = BillingPeriod | 'ANNUAL';

export interface EdobPricingTier {
  minUsers: number;
  maxUsers: number | null;
  perUserCents: number;
  label: string;
  pricePerUserPence?: number;
  pricePerUserDisplay?: string;
}

export interface EdobSubscriptionStatus {
  active: boolean;
  status?: string;
  planCode?: string;
  planName?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: string;
}

export interface EdobUsage {
  userCount: number;
  siteCount?: number;
  keyCount?: number;
  storageUsedGb?: number;
}

export interface EdobOverview {
  trialActive: boolean;
  subscribed?: boolean;
  status?: string;
  trial?: any;
  trialStartDate?: string;
  trialEndDate?: string;
  trialDaysRemaining?: number | null;
  subscription?: EdobSubscriptionStatus;
  usage?: EdobUsage;
  tiers?: EdobPricingTier[];
  quote?: EdobQuote;
  features?: Record<string, any>;
  [key: string]: any;
}

export interface EdobQuote {
  userCount: number;
  perUserCents: number;
  subtotalCents: number;
  vatRateBps?: number;
  vatCents?: number;
  totalCents: number;
  currency: string;
  tierLabel?: string;
  tiers?: EdobPricingTier[];
  subtotalPence?: number;
  vatPence?: number;
  totalPence?: number;
  subtotalDisplay?: string;
  vatDisplay?: string;
  totalDisplay?: string;
  [key: string]: any;
}

export interface EdobBillingDetails {
  companyName: string;
  contactName: string;
  billingEmail: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  country: string;
}

export interface EdobSubscribeRequest {
  userCount: number;
  billing: EdobBillingDetails;
  paymentMethodId: string;
  [key: string]: any;
}

export interface EdobSubscribeResponse {
  subscription?: EdobSubscriptionStatus;
  invoice?: any;
  clientSecret?: string;
  [key: string]: any;
}

export type EdobInvoiceStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'VOID' | string;

export interface EdobInvoice {
  id: string;
  number: string;
  status: EdobInvoiceStatus;
  paymentStatus?: string;
  description: string;
  invoiceDate: string;
  periodStart?: string;
  periodEnd?: string;
  dueAt: string;
  paidAt?: string;
  totalCents: number;
  currency: string;
  amountDisplay?: string;
  [key: string]: any;
}

export interface EdobInvoiceListResponse {
  invoices: EdobInvoice[];
  total: number;
  page?: number;
  size?: number;
  totalPages?: number;
  [key: string]: any;
}

export interface EdobInvoiceStats {
  totalInvoices: number;
  paid: number;
  pending: number;
  overdue: number;
  totalAmountCents?: number;
  totalAmountDisplay?: string;
  [key: string]: any;
}

export interface EdobInvoiceLineItem {
  description?: string;
  subDescription?: string;
  detail?: string;
  quantity?: number;
  unitPriceCents?: number;
  unitPricePence?: number;
  unitPriceDisplay?: string;
  amountCents?: number;
  amountPence?: number;
  amountDisplay?: string;
  [key: string]: any;
}

export interface EdobInvoiceDetail {
  id: string;
  number: string;
  status: EdobInvoiceStatus;
  paymentStatus?: 'PAID' | 'PENDING' | 'OVERDUE';
  description: string;
  invoiceDate: string;
  periodStart?: string;
  periodEnd?: string;
  dueAt: string;
  paidAt?: string;
  subtotalCents?: number;
  vatRateBps?: number;
  vatCents?: number;
  totalCents: number;
  currency: string;
  hostedInvoiceUrl?: string | null;
  pdfUrl?: string | null;
  items?: EdobInvoiceLineItem[];
  billing?: {
    companyName?: string;
    billingEmail?: string;
    billingAddress?: string;
    address?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  subscription?: {
    userLicences?: number;
    userCount?: number;
    perUserCents?: number;
    billingCycle?: string;
    billingPeriod?: string;
    nextBillingDate?: string;
    planType?: string;
    title?: string;
    planName?: string;
    planCode?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
  };
  notes?: string;
  issueDate?: string;
  dueDate?: string;
  dueInDays?: number | null;
  amountDuePence?: number;
  amountDueDisplay?: string;
  subtotalPence?: number;
  subtotalDisplay?: string;
  vatPence?: number;
  vatDisplay?: string;
  totalPence?: number;
  totalDisplay?: string;
  [key: string]: any;
}

export interface EdobInvoicePayResponse {
  success: boolean;
  invoice?: EdobInvoiceDetail;
  [key: string]: any;
}

export interface ServiceInfo {
  serviceCode: string;
  name: string;
  description?: string;
  active: boolean;
  [key: string]: any;
}

export interface BillingInfo {
  companyName: string;
  billingEmail: string;
  billingAddress: string;
  city: string;
  postcode: string;
  country: string;
  vatNumber?: string;
  [key: string]: any;
}

export interface BillingProfile {
  companyName?: string;
  billingEmail?: string;
  billingAddress?: string;
  city?: string;
  postcode?: string;
  country?: string;
  vatNumber?: string;
  vatRateBps?: number | null;
  [key: string]: any;
}

export interface GenericInvoice {
  id: string;
  number: string;
  status: string;
  paymentStatus?: string;
  description: string;
  issueDate: string;
  dueDate: string;
  amountCents: number;
  amountDisplay: string;
  currency: string;
  [key: string]: any;
}

export interface GenericInvoiceDetail {
  id: string;
  number: string;
  status: string;
  paymentStatus?: string;
  description: string;
  issueDate: string;
  dueDate: string;
  dueInDays?: number | null;
  subtotalCents: number;
  subtotalDisplay: string;
  vatCents: number;
  vatDisplay: string;
  totalCents: number;
  totalDisplay: string;
  currency: string;
  vatRateBps?: number;
  lineItems: EdobInvoiceLineItem[];
  billing?: {
    companyName?: string;
    billingEmail?: string;
    address?: string;
    vatNumber?: string;
  };
  subscription?: {
    title?: string;
    planName?: string;
    planCode?: string;
    billingPeriod?: string;
  };
  [key: string]: any;
}

export interface GenericInvoiceStats {
  totalInvoices: number;
  paid: number;
  pending: number;
  overdue: number;
  totalAmountCents?: number;
  totalAmountDisplay?: string;
  [key: string]: any;
}