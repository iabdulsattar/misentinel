export type PlanType = 'FREE' | 'PRO' | 'ENTERPRISE';

export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'CANCELLED';

export interface Subscription {
  id: string;
  organizationId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StartSubscriptionRequest {
  plan: PlanType;
}

export interface StartSubscriptionResponse {
  subscription: Subscription;
}

export interface ChangePlanRequest {
  plan: PlanType;
}

export interface ChangePlanResponse {
  subscription: Subscription;
}

export interface ListSubscriptionsResponse {
  subscriptions: Subscription[];
}
