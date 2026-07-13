import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../config';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token_saas') || sessionStorage.getItem('access_token_saas');
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private getJsonHeaders(): HttpHeaders {
    return this.getHeaders().set('Content-Type', 'application/json');
  }

  listUsers(orgId: string, options: { q?: string; status?: string; page?: number; size?: number } = {}): Observable<any> {
    let params = new HttpParams();
    if (options.q) params = params.set('q', options.q);
    if (options.status) params = params.set('status', options.status);
    if (options.page != null) params = params.set('page', String(options.page));
    if (options.size != null) params = params.set('size', String(options.size));

    return this.http.get<any>(`${API_BASE}/api/v1/users/organizations/${orgId}/users`, {
      headers: this.getHeaders(),
      params,
    });
  }

  getStats(orgId: string): Observable<any> {
    return this.http.get<any>(`${API_BASE}/api/v1/users/organizations/${orgId}/users/stats`, {
      headers: this.getHeaders(),
    });
  }

  getUserDetail(orgId: string, userId: string): Observable<any> {
    return this.http.get<any>(`${API_BASE}/api/v1/users/organizations/${orgId}/users/${userId}`, {
      headers: this.getHeaders(),
    });
  }

  createUser(orgId: string, payload: any): Observable<any> {
    return this.http.post<any>(`${API_BASE}/api/v1/users/organizations/${orgId}/users`, payload, {
      headers: this.getJsonHeaders(),
    });
  }

  updateUser(orgId: string, userId: string, payload: any): Observable<any> {
    return this.http.patch<any>(`${API_BASE}/api/v1/users/organizations/${orgId}/users/${userId}`, payload, {
      headers: this.getJsonHeaders(),
    });
  }

  deactivateUser(orgId: string, userId: string, payload: { reason: string; note?: string } = { reason: 'OTHER', note: '' }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/api/v1/users/organizations/${orgId}/users/${userId}/deactivate`, payload, {
      headers: this.getJsonHeaders(),
    });
  }

  reactivateUser(orgId: string, userId: string): Observable<any> {
    return this.http.post<any>(`${API_BASE}/api/v1/users/organizations/${orgId}/users/${userId}/reactivate`, {}, {
      headers: this.getJsonHeaders(),
    });
  }

  sendInvitation(orgId: string, userId: string, companyName = 'ABC Security'): Observable<any> {
    const headers = this.getJsonHeaders().set('X-Company-Name', companyName);
    return this.http.post<any>(`${API_BASE}/api/v1/users/organizations/${orgId}/users/${userId}/invitations/send`, {}, { headers });
  }

  revokeInvitation(orgId: string, userInvitationId: string): Observable<any> {
    return this.http.delete<any>(`${API_BASE}/api/v1/users/organizations/${orgId}/invitations/${userInvitationId}`, {
      headers: this.getHeaders(),
    });
  }

  previewInvitation(token: string): Observable<any> {
    return this.http.get<any>(`${API_BASE}/api/v1/invitations/${token}`);
  }

  acceptInvitation(token: string, payload: { password: string }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/api/v1/invitations/${token}/accept`, payload, {
      headers: this.getJsonHeaders(),
    });
  }
}
