import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SubscriptionStatusService } from '../services/subscription-status.service';

export const subscriptionGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const subscriptionStatus = inject(SubscriptionStatusService);

  const allowedPaths = ['/subscription', '/invoice-details', '/subscription/checkout', '/signin', '/login'];
  const isAllowedPath = allowedPaths.some((path) => state.url.startsWith(path));

  if (isAllowedPath) {
    return true;
  }

  const orgId = (() => {
    const remember = localStorage.getItem('remember_device') === 'true';
    const storage = remember ? localStorage : sessionStorage;
    return storage.getItem('org_id') || storage.getItem('organizationId') || null;
  })();

  if (!orgId) {
    return true;
  }

  await subscriptionStatus.refresh();

  if (subscriptionStatus.isActive()) {
    return true;
  }

  return router.createUrlTree(['/subscription']);
};
