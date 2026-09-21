import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Plan,
  CreatePlanRequest,
  StartSubscriptionRequest,
  StartSubscriptionResponse,
  ChangePlanRequest,
  ChangePlanResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  ListSubscriptionsResponse,
  SubscriptionHistoryResponse,
  SubscriptionCheckResponse,
  EdobOverview,
  EdobQuote,
  EdobSubscribeRequest,
  EdobSubscribeResponse,
  EdobInvoice,
  EdobInvoiceListResponse,
  EdobInvoiceStats,
  EdobInvoiceDetail,
  EdobInvoicePayResponse
} from '../models/subscription.models';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  constructor(private api: ApiService) {}

  // -------- Plans --------

  // GET /api/v1/subscriptions/plans
  listPlans(): Observable<Plan[]> {
    return this.api.get<Plan[]>('/api/v1/subscriptions/plans');
  }

  // GET /api/v1/subscriptions/plans/{planId}
  getPlan(planId: string): Observable<Plan> {
    return this.api.get<Plan>(`/api/v1/subscriptions/plans/${planId}`);
  }

  // POST /api/v1/subscriptions/plans (ADMIN)
  createPlan(payload: CreatePlanRequest): Observable<Plan> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<Plan>('/api/v1/subscriptions/plans', payload, headers);
  }

  // POST /api/v1/subscriptions/plans/{planId}/sync (ADMIN — sync to Stripe)
  syncPlanToStripe(planId: string): Observable<any> {
    return this.api.post(`/api/v1/subscriptions/plans/${planId}/sync`, {});
  }

  // POST /api/v1/subscriptions/plans/{planId}/disable (ADMIN)
  disablePlan(planId: string): Observable<any> {
    return this.api.post(`/api/v1/subscriptions/plans/${planId}/disable`, {});
  }

  // -------- Subscription Lifecycle --------

  // POST /api/v1/subscriptions/organizations/{orgId}/start?orgEmail=&orgName=
  startSubscription(
    orgId: string,
    payload: StartSubscriptionRequest,
    orgEmail?: string,
    orgName?: string,
    token?: string
  ): Observable<StartSubscriptionResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    });
    let query = '';
    if (orgEmail || orgName) {
      const params = new URLSearchParams();
      if (orgEmail) params.set('orgEmail', orgEmail);
      if (orgName) params.set('orgName', orgName);
      query = `?${params.toString()}`;
    }
    return this.api.post<StartSubscriptionResponse>(
      `/api/v1/subscriptions/organizations/${orgId}/start${query}`,
      payload,
      headers
    );
  }

  // GET /api/v1/subscriptions/organizations/{orgId}
  getCurrentSubscription(orgId: string): Observable<ListSubscriptionsResponse> {
    return this.api.get<ListSubscriptionsResponse>(`/api/v1/subscriptions/organizations/${orgId}`);
  }

  // PATCH /api/v1/subscriptions/organizations/{orgId}/plan
  changePlan(orgId: string, payload: ChangePlanRequest, token?: string): Observable<ChangePlanResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    });
    return this.api.patch<ChangePlanResponse>(`/api/v1/subscriptions/organizations/${orgId}/plan`, payload, headers);
  }

  // POST /api/v1/subscriptions/organizations/{orgId}/cancel
  cancelSubscription(orgId: string, payload: CancelSubscriptionRequest, token?: string): Observable<CancelSubscriptionResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    });
    return this.api.post<CancelSubscriptionResponse>(`/api/v1/subscriptions/organizations/${orgId}/cancel`, payload, headers);
  }

  // GET /api/v1/subscriptions/organizations/{orgId}/history
  getSubscriptionHistory(orgId: string): Observable<SubscriptionHistoryResponse> {
    return this.api.get<SubscriptionHistoryResponse>(`/api/v1/subscriptions/organizations/${orgId}/history`);
  }

  // -------- Subscription Check (gating) --------

  // GET /api/v1/subscriptions/check?organizationId={orgId}
  checkSubscription(orgId: string): Observable<SubscriptionCheckResponse> {
    return this.api.get<SubscriptionCheckResponse>(`/api/v1/subscriptions/check?organizationId=${encodeURIComponent(orgId)}`);
  }

  // -------- eDOB Subscription (per-seat) --------

  // GET /api/v1/subscriptions/organizations/{orgId}/edob/overview?userCount=10
  getEdobOverview(orgId: string, userCount?: number): Observable<EdobOverview> {
    const params = new URLSearchParams();
    if (userCount !== undefined && userCount !== null) {
      params.set('userCount', String(userCount));
    }
    const query = params.toString();
    return this.api.get<EdobOverview>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/edob/overview${query ? `?${query}` : ''}`
    );
  }

  // GET /api/v1/subscriptions/organizations/{orgId}/edob/quote?userCount=256
  getEdobQuote(orgId: string, userCount: number): Observable<EdobQuote> {
    const params = new URLSearchParams();
    params.set('userCount', String(userCount));
    return this.api.get<EdobQuote>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/edob/quote?${params.toString()}`
    );
  }

  // POST /api/v1/subscriptions/organizations/{orgId}/edob/subscribe
  subscribeToEdob(orgId: string, payload: EdobSubscribeRequest): Observable<EdobSubscribeResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<EdobSubscribeResponse>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/edob/subscribe`,
      payload,
      headers
    );
  }

  // GET /api/v1/subscriptions/organizations/{orgId}/edob/invoices
  listEdobInvoices(orgId: string, options?: {
    from?: string;
    to?: string;
    status?: string;
    q?: string;
    page?: number;
    size?: number;
  }): Observable<EdobInvoiceListResponse> {
    const params = new URLSearchParams();
    if (options?.from) params.set('from', options.from);
    if (options?.to) params.set('to', options.to);
    if (options?.status) params.set('status', options.status);
    if (options?.q) params.set('q', options.q);
    if (options?.page !== undefined) params.set('page', String(options.page));
    if (options?.size !== undefined) params.set('size', String(options.size));
    const query = params.toString();
    return this.api.get<EdobInvoiceListResponse>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/edob/invoices${query ? `?${query}` : ''}`
    );
  }

  // GET /api/v1/subscriptions/organizations/{orgId}/edob/invoices/stats
  getEdobInvoiceStats(orgId: string): Observable<EdobInvoiceStats> {
    return this.api.get<EdobInvoiceStats>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/edob/invoices/stats`
    );
  }

  // GET /api/v1/subscriptions/organizations/{orgId}/edob/invoices/{invoiceId}
  getEdobInvoice(orgId: string, invoiceId: string): Observable<EdobInvoiceDetail> {
    return this.api.get<EdobInvoiceDetail>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/edob/invoices/${encodeURIComponent(invoiceId)}`
    );
  }

  // POST /api/v1/subscriptions/organizations/{orgId}/edob/invoices/{invoiceId}/pay
  payEdobInvoice(orgId: string, invoiceId: string): Observable<EdobInvoicePayResponse> {
    return this.api.post<EdobInvoicePayResponse>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/edob/invoices/${encodeURIComponent(invoiceId)}/pay`,
      {}
    );
  }
}