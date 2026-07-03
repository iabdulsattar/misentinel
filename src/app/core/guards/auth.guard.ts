import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token_saas');

  if (token) {
    return true;
  }

  return router.createUrlTree(['/signin'], {
    queryParams: { returnUrl: state.url },
  });
};
