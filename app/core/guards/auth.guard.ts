import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Check if user has access token
  const token = localStorage.getItem('access_token_saas');
  
  if (token) {
    return true;
  }
  
  // If not authenticated, redirect to login
  router.navigate(['/signin'], {
    queryParams: { returnUrl: state.url }
  });
  
  return false;
};
