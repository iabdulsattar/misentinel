import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const remember = localStorage.getItem('remember_device');
  const token = remember === 'true'
    ? localStorage.getItem('access_token_saas')
    : (localStorage.getItem('access_token_saas') || sessionStorage.getItem('access_token_saas'));

  if (token) {
    const expiresAt = localStorage.getItem('session_expires_at');
    if (expiresAt && Number(expiresAt) < Date.now()) {
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
      return router.createUrlTree(['/signin'], {
        queryParams: { returnUrl: state.url },
      });
    }
    return true;
  }

  return router.createUrlTree(['/signin'], {
    queryParams: { returnUrl: state.url },
  });
};
