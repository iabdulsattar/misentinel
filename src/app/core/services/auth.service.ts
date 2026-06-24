import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  ProfileResponse,
  InviteMemberRequest,
  InviteMemberResponse,
  InvitationResponse,
  AcceptInvitationRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,

  ResendOtpRequest,
  ResendOtpResponse,
  VerifySignupOtpRequest,
  VerifySignupOtpResponse,
  Verify2faRequest,
  Verify2faResponse,

  RequestPasswordResetRequest,
  RequestPasswordResetResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,

  SessionResponse
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private api: ApiService) {}

  signup(payload: SignupRequest): Observable<SignupResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post('/api/v1/auth/signup', payload, headers);
  }

  // POST /api/v1/auth/signup/resend-otp
  resendSignupOtp(payload: ResendOtpRequest): Observable<ResendOtpResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post('/api/v1/auth/signup/resend-otp', payload, headers);
  }

  // POST /api/v1/auth/signup/verify-otp
  verifySignupOtp(payload: VerifySignupOtpRequest): Observable<VerifySignupOtpResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post('/api/v1/auth/signup/verify-otp', payload, headers);
  }

  // POST /api/v1/auth/login
  login(payload: LoginRequest): Observable<LoginResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post('/api/v1/auth/login', payload, headers);
  }

  // POST /api/v1/auth/login/verify-2fa
  verify2fa(payload: Verify2faRequest): Observable<Verify2faResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post('/api/v1/auth/login/verify-2fa', payload, headers);
  }

  me(token?: string): Observable<ProfileResponse> {
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.api.get('/api/v1/auth/me', headers as any);
  }

  listOrganizations(token?: string): Observable<{ organizations: any[] }> {
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.api.get('/api/v1/auth/me/organizations', headers as any);
  }

  // GET /api/v1/auth/me/session
  // Returns 200 even when no subscription exists.
  getSession(token?: string): Observable<SessionResponse> {
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.api.get('/api/v1/auth/me/session', headers as any);
  }

  inviteMember(orgId: string, payload: InviteMemberRequest, token?: string): Observable<InviteMemberResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    });
    return this.api.post(`/api/v1/auth/organizations/${orgId}/invitations`, payload, headers);
  }

  readInvitation(token: string): Observable<InvitationResponse> {
    return this.api.get(`/api/v1/auth/invitations/${token}`);
  }

  acceptInvitation(token: string, payload: AcceptInvitationRequest): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post(`/api/v1/auth/invitations/${token}/accept`, payload, headers);
  }

  // POST /api/v1/auth/password/request-reset
  requestPasswordReset(payload: RequestPasswordResetRequest): Observable<RequestPasswordResetResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post('/api/v1/auth/password/request-reset', payload, headers);
  }

  // POST /api/v1/auth/password/reset
  resetPassword(payload: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post('/api/v1/auth/password/reset', payload, headers);
  }

  refresh(payload: RefreshTokenRequest): Observable<RefreshTokenResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post('/api/v1/auth/refresh', payload, headers);
  }

  logout(payload: LogoutRequest): Observable<void> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post('/api/v1/auth/logout', payload, headers);
  }
}

