import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  StartSubscriptionRequest,
  StartSubscriptionResponse,
  ChangePlanRequest,
  ChangePlanResponse,
  ListSubscriptionsResponse
} from '../models/subscription.models';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  constructor(private api: ApiService) {}

  startSubscription(orgId: string, payload: StartSubscriptionRequest, token?: string): Observable<StartSubscriptionResponse> {
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.api.post(`/api/v1/subscriptions/organizations/${orgId}`, payload, headers as any);
  }

  listSubscriptions(orgId: string): Observable<ListSubscriptionsResponse> {
    return this.api.get(`/api/v1/subscriptions/organizations/${orgId}`);
  }

  changePlan(orgId: string, payload: ChangePlanRequest, token?: string): Observable<ChangePlanResponse> {
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.api.patch(`/api/v1/subscriptions/organizations/${orgId}/plan`, payload, headers as any);
  }
}
