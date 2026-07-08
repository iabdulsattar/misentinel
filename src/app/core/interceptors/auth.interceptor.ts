import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, switchMap, tap, filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshQueue: Array<(token: string) => void> = [];
  private refreshSupported = true;

  constructor(private router: Router, private authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isPublicAuthPath(req.url)) {
      return next.handle(req);
    }

    const token = this.getAccessToken();

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(req).pipe(
      catchError((err) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          return this.handle401(req, next);
        }
        return of(err as any);
      }),
      tap({
        error: (err) => {
          if (err instanceof HttpErrorResponse && err.status === 401) {
            localStorage.removeItem('access_token_saas');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('remember_device');
            localStorage.removeItem('session_expires_at');
            sessionStorage.removeItem('access_token_saas');
            sessionStorage.removeItem('refresh_token');
            this.router.navigate(['/signin']);
          }
        },
      })
    );
  }

  private isPublicAuthPath(url: string): boolean {
    const publicPaths = [
      '/api/v1/auth/signup',
      '/api/v1/auth/login',
      '/api/v1/auth/signup/verify-otp',
      '/api/v1/auth/login/verify-2fa',
      '/api/v1/auth/password/request-reset',
      '/api/v1/auth/password/reset',
      '/api/v1/auth/invitations',
      '/api/v1/auth/refresh',
    ];
    return publicPaths.some(path => url.includes(path));
  }

  private handle401(req: HttpRequest<unknown>, next: HttpHandler) {
    if (!this.isRefreshing && this.refreshSupported) {
      this.isRefreshing = true;
      const refreshToken = this.getRefreshToken();

      if (!refreshToken) {
        this.isRefreshing = false;
        this.clearTokens();
        this.router.navigate(['/signin']);
        return from([new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })]);
      }

      return from(this.authService.refresh({ refreshToken })).pipe(
        switchMap((res: any) => {
          this.isRefreshing = false;
          const newToken = res?.access_token;
          const newRefreshToken = res?.refresh_token;
          if (newToken) {
            this.setAccessToken(newToken);
          }
          if (newRefreshToken) {
            this.setRefreshToken(newRefreshToken);
          }
          this.flushRefreshQueue(newToken);
          return next.handle(req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` }
          }));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          if (err instanceof HttpErrorResponse && err.status === 404) {
            this.refreshSupported = false;
          }
          this.flushRefreshQueue(null);
          this.clearTokens();
          this.router.navigate(['/signin']);
          return from([new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })]);
        })
      );
    }

    if (!this.refreshSupported) {
      this.clearTokens();
      this.router.navigate(['/signin']);
      return from([new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })]);
    }

    return new Observable<HttpEvent<unknown>>((observer) => {
      this.refreshQueue.push((token: string) => {
        next.handle(req.clone({
          setHeaders: { Authorization: `Bearer ${token}` }
        })).subscribe({
          next: (res) => observer.next(res),
          error: (err) => observer.error(err),
          complete: () => observer.complete(),
        });
      });
    });
  }

  private flushRefreshQueue(token: string | null) {
    this.refreshQueue.forEach((callback) => callback(token || ''));
    this.refreshQueue = [];
  }

  private getAccessToken(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('access_token_saas');
    }
    return sessionStorage.getItem('access_token_saas') || localStorage.getItem('access_token_saas');
  }

  private getRefreshToken(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('refresh_token');
    }
    return sessionStorage.getItem('refresh_token') || localStorage.getItem('refresh_token');
  }

  private setAccessToken(token: string) {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      localStorage.setItem('access_token_saas', token);
      localStorage.setItem('session_expires_at', String(Date.now() + 24 * 60 * 60 * 1000));
    } else {
      sessionStorage.setItem('access_token_saas', token);
    }
  }

  private setRefreshToken(token: string) {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      localStorage.setItem('refresh_token', token);
    } else {
      sessionStorage.setItem('refresh_token', token);
    }
  }

  private clearTokens() {
    localStorage.removeItem('access_token_saas');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('remember_device');
    localStorage.removeItem('session_expires_at');
    localStorage.removeItem('org_id');
    localStorage.removeItem('organizationId');
    sessionStorage.removeItem('access_token_saas');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('org_id');
    sessionStorage.removeItem('organizationId');
  }
}
