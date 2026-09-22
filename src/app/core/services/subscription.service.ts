import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiWrapper } from '../models/auth.models';
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
  EdobInvoicePayResponse,
  ServiceInfo,
  BillingInfo,
  BillingProfile,
  GenericInvoice,
  GenericInvoiceDetail,
  GenericInvoiceStats
} from '../models/subscription.models';

export const SERVICE_CODE = 'edob';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  constructor(private api: ApiService) {}

  // -------- Plans --------

  // GET /api/v1/subscriptions/plans?serviceCode={serviceCode}&country={country}
  listPlans(serviceCode?: string, country?: string): Observable<Plan[]> {
    const params = new URLSearchParams();
    if (serviceCode) params.set('serviceCode', serviceCode);
    if (country) params.set('country', country);
    const query = params.toString();
    return this.api.get<ApiWrapper<Plan[]>>(
      `/api/v1/subscriptions/plans${query ? `?${query}` : ''}`
    ).pipe(map((res) => res.data));
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

  // GET /api/v1/subscriptions/services (list subscribable services)
  listSubscribableServices(): Observable<ServiceInfo[]> {
    return this.api.get<ServiceInfo[]>('/api/v1/subscriptions/services');
  }

  // -------- Subscription Lifecycle (service-scoped) --------

  // POST /api/v1/subscriptions/organizations/{orgId}/services/{serviceCode}/start
  startSubscription(
    orgId: string,
    payload: StartSubscriptionRequest,
    serviceCode = SERVICE_CODE,
    token?: string
  ): Observable<StartSubscriptionResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    });
    const finalPayload = { ...payload };
    return this.api.post<ApiWrapper<StartSubscriptionResponse>>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/services/${encodeURIComponent(serviceCode)}/start`,
      finalPayload,
      headers
    ).pipe(map((res) => res.data));
  }

  // GET /api/v1/subscriptions/organizations/{orgId}/services/{serviceCode}
  getCurrentSubscription(orgId: string, serviceCode = SERVICE_CODE): Observable<ListSubscriptionsResponse> {
    return this.api.get<ListSubscriptionsResponse>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/services/${encodeURIComponent(serviceCode)}`
    );
  }

  // PATCH /api/v1/subscriptions/organizations/{orgId}/services/{serviceCode}/plan
  changePlan(orgId: string, payload: ChangePlanRequest, serviceCode = SERVICE_CODE, token?: string): Observable<ChangePlanResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    });
    return this.api.patch<ChangePlanResponse>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/services/${encodeURIComponent(serviceCode)}/plan`,
      payload,
      headers
    );
  }

  // POST /api/v1/subscriptions/organizations/{orgId}/services/{serviceCode}/cancel
  cancelSubscription(orgId: string, payload: CancelSubscriptionRequest, serviceCode = SERVICE_CODE, token?: string): Observable<CancelSubscriptionResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    });
    return this.api.post<CancelSubscriptionResponse>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/services/${encodeURIComponent(serviceCode)}/cancel`,
      payload,
      headers
    );
  }

  // GET /api/v1/subscriptions/organizations/{orgId}/history?serviceCode={serviceCode}
  getSubscriptionHistory(orgId: string, serviceCode = SERVICE_CODE): Observable<SubscriptionHistoryResponse> {
    return this.api.get<SubscriptionHistoryResponse>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/history?serviceCode=${encodeURIComponent(serviceCode)}`
    );
  }

  // -------- Subscription Check (gating) --------

  // GET /api/v1/subscriptions/check?organizationId={orgId}&serviceCode={serviceCode}
  checkSubscription(orgId: string, serviceCode = SERVICE_CODE): Observable<SubscriptionCheckResponse> {
    return this.api.get<ApiWrapper<SubscriptionCheckResponse>>(
      `/api/v1/subscriptions/check?organizationId=${encodeURIComponent(orgId)}&serviceCode=${encodeURIComponent(serviceCode)}`
    ).pipe(map((res) => res.data));
  }

  // -------- Billing Information --------

  // GET /api/v1/subscriptions/organizations/{orgId}/billing-info
  getBillingInfo(orgId: string): Observable<BillingInfo> {
    return this.api.get<BillingInfo>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/billing-info`
    );
  }

  // PUT /api/v1/subscriptions/organizations/{orgId}/billing-info
  saveBillingInfo(orgId: string, payload: BillingInfo): Observable<BillingInfo> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.put<BillingInfo>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/billing-info`,
      payload,
      headers
    );
  }

  // -------- Billing Profile --------

  // GET /api/v1/subscriptions/organizations/{orgId}/billing
  getBillingProfile(orgId: string): Observable<BillingProfile> {
    return this.api.get<BillingProfile>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/billing`
    );
  }

  // PUT /api/v1/subscriptions/organizations/{orgId}/billing
  saveBillingProfile(orgId: string, payload: BillingProfile): Observable<BillingProfile> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.put<BillingProfile>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/billing`,
      payload,
      headers
    );
  }

  // -------- Generic Invoices (service-scoped) --------

  // GET /api/v1/subscriptions/organizations/{orgId}/services/{serviceCode}/invoices
  listGenericInvoices(
    orgId: string,
    serviceCode = SERVICE_CODE,
    options?: {
      from?: string;
      to?: string;
      status?: string;
      paymentStatus?: string;
      q?: string;
      page?: number;
      size?: number;
      sort?: string;
    }
  ): Observable<{ invoices: GenericInvoice[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.from) params.set('from', options.from);
    if (options?.to) params.set('to', options.to);
    if (options?.status) params.set('status', options.status);
    if (options?.paymentStatus) params.set('paymentStatus', options.paymentStatus);
    if (options?.q) params.set('q', options.q);
    if (options?.page !== undefined) params.set('page', String(options.page));
    if (options?.size !== undefined) params.set('size', String(options.size));
    if (options?.sort) params.set('sort', options.sort);
    const query = params.toString();
    return this.api.get<{ invoices: GenericInvoice[]; total: number }>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/services/${encodeURIComponent(serviceCode)}/invoices${query ? `?${query}` : ''}`
    );
  }

  // GET /api/v1/subscriptions/organizations/{orgId}/services/{serviceCode}/invoices/stats
  getGenericInvoiceStats(orgId: string, serviceCode = SERVICE_CODE): Observable<GenericInvoiceStats> {
    return this.api.get<GenericInvoiceStats>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/services/${encodeURIComponent(serviceCode)}/invoices/stats`
    );
  }

  // GET /api/v1/subscriptions/organizations/{orgId}/invoices/{invoiceId}
  getGenericInvoice(orgId: string, invoiceId: string): Observable<GenericInvoiceDetail> {
    return this.api.get<GenericInvoiceDetail>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/invoices/${encodeURIComponent(invoiceId)}`
    );
  }

  // POST /api/v1/users/organizations/{orgId}/services/{serviceCode}/enable
  enableService(orgId: string, serviceCode = SERVICE_CODE, token?: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    });
    return this.api.post(
      `/api/v1/users/organizations/${encodeURIComponent(orgId)}/services/${encodeURIComponent(serviceCode)}/enable`,
      {},
      headers
    );
  }

  // -------- eDOB Subscription (per-seat) --------

  // -------- eDOB Subscription (per-seat) --------

  // GET /api/v1/subscriptions/organizations/{orgId}/edob/overview?userCount=10
  getEdobOverview(orgId: string, userCount?: number): Observable<EdobOverview> {
    const params = new URLSearchParams();
    if (userCount !== undefined && userCount !== null) {
      params.set('userCount', String(userCount));
    }
    const query = params.toString();
    return this.api.get<ApiWrapper<EdobOverview>>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/edob/overview${query ? `?${query}` : ''}`
    ).pipe(map((res) => res.data));
  }

  // GET /api/v1/subscriptions/organizations/{orgId}/edob/quote?userCount=256
  getEdobQuote(orgId: string, userCount: number): Observable<EdobQuote> {
    const params = new URLSearchParams();
    params.set('userCount', String(userCount));
    return this.api.get<ApiWrapper<EdobQuote>>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/edob/quote?${params.toString()}`
    ).pipe(map((res) => res.data));
  }

  // POST /api/v1/subscriptions/organizations/{orgId}/edob/subscribe
  subscribeToEdob(orgId: string, payload: EdobSubscribeRequest): Observable<EdobSubscribeResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<ApiWrapper<EdobSubscribeResponse>>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/edob/subscribe`,
      payload,
      headers
    ).pipe(map((res) => res.data));
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
    return this.api.get<ApiWrapper<any>>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/edob/invoices${query ? `?${query}` : ''}`
    ).pipe(
      map((res: any) => ({
        invoices: res?.data || [],
        total: res?.meta?.totalElements || (res?.data?.length ?? 0),
        page: res?.meta?.page,
        size: res?.meta?.size,
        totalPages: res?.meta?.totalPages,
      }))
    );
  }

  // GET /api/v1/subscriptions/organizations/{orgId}/edob/invoices/stats
  getEdobInvoiceStats(orgId: string): Observable<EdobInvoiceStats> {
    return this.api.get<ApiWrapper<EdobInvoiceStats>>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/edob/invoices/stats`
    ).pipe(map((res) => res.data));
  }

  // GET /api/v1/subscriptions/organizations/{orgId}/edob/invoices/{invoiceId}
  getEdobInvoice(orgId: string, invoiceId: string): Observable<EdobInvoiceDetail> {
    return this.api.get<ApiWrapper<EdobInvoiceDetail>>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/edob/invoices/${encodeURIComponent(invoiceId)}`
    ).pipe(map((res) => res.data));
  }

  // POST /api/v1/subscriptions/organizations/{orgId}/edob/invoices/{invoiceId}/pay
  payEdobInvoice(orgId: string, invoiceId: string): Observable<EdobInvoicePayResponse> {
    return this.api.post<ApiWrapper<EdobInvoicePayResponse>>(
      `/api/v1/subscriptions/organizations/${encodeURIComponent(orgId)}/edob/invoices/${encodeURIComponent(invoiceId)}/pay`,
      {}
    ).pipe(map((res) => res.data));
  }
}