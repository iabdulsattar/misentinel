import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SubscriptionStatusService } from '../services/subscription-status.service';
import { PermissionService } from '../services/permission.service';

export const subscriptionGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const subscriptionStatus = inject(SubscriptionStatusService);

  const allowedPaths = [
    '/subscription',
    '/invoice-details',
    '/subscription/checkout',
    '/signin',
    '/login',
    '/external-login',
    '/auth/external-login',
    '/subscription-trial-start',
    '/subscription-trial-ready',
    '/subscription-plan'
  ];
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

  // Only administrators may manage billing, and `/subscription` is admin-only
  // behind `adminGuard`. Sending a member there would bounce them straight back
  // to the dashboard, so send them straight there instead.
  const permissionService = inject(PermissionService);
  if (!permissionService.isOrgAdmin()) {
    return router.createUrlTree(['/dashboard']);
  }

  return router.createUrlTree(['/subscription']);
};
