import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SubscriptionStatusService } from '../services/subscription-status.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const subscriptionStatus = inject(SubscriptionStatusService);

  const token = authService.getAccessToken();

  if (!token) {
    subscriptionStatus.clear();
    return router.createUrlTree(['/signin'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const expiresAt = authService.isRemembered()
    ? localStorage.getItem('session_expires_at')
    : sessionStorage.getItem('session_expires_at');

  if (expiresAt && Number(expiresAt) < Date.now()) {
    authService.clearTokens();
    subscriptionStatus.clear();
    return router.createUrlTree(['/signin'], {
      queryParams: { returnUrl: state.url },
    });
  }

  return true;
};
