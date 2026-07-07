import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { CheckboxComponent } from '../../../shared/components/form/input/checkbox.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-signin-form',
  imports: [
    RouterModule,
    FormsModule,
    InputFieldComponent,
    LabelComponent,
    CheckboxComponent,
    ButtonComponent
  ],
  templateUrl: './signin-form.component.html',
  styles: ''
})
export class SigninFormComponent {

  constructor(private authService: AuthService, private router: Router) {}

  showPassword = false;
  isChecked = false;

  email = '';
  password = '';

  isLoading = false;
  errorMessage = '';

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    this.isLoading = true;
    this.errorMessage = '';

     this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        console.log('Login successful:', res);
        const data = res as any;
        const accessToken = data?.tokens?.access_token ?? data?.access_token;
        const refreshToken = data?.tokens?.refresh_token ?? data?.refresh_token;

        if (!accessToken) {
          this.isLoading = false;
          this.errorMessage = 'Login succeeded but no access token was returned. Please contact support.';
          return;
        }

        const orgs = data?.tokens?.organizations ?? [];

        const storeOrgId = (id: string) => {
          if (this.isChecked) {
            localStorage.setItem('org_id', id);
          } else {
            sessionStorage.setItem('org_id', id);
          }
        };

        const applyTokens = (token: string, refresh: string | undefined, orgId?: string) => {
          if (this.isChecked) {
            localStorage.setItem('access_token_saas', token);
            localStorage.setItem('refresh_token', refresh ?? '');
            localStorage.setItem('remember_device', 'true');
            localStorage.setItem('session_expires_at', String(Date.now() + 24 * 60 * 60 * 1000));
            sessionStorage.removeItem('access_token_saas');
            sessionStorage.removeItem('refresh_token');
          } else {
            sessionStorage.setItem('access_token_saas', token);
            sessionStorage.setItem('refresh_token', refresh ?? '');
            sessionStorage.removeItem('remember_device');
            localStorage.removeItem('access_token_saas');
            localStorage.removeItem('refresh_token');
          }

          if (orgId) {
            storeOrgId(orgId);
          }
        };

        applyTokens(accessToken, refreshToken, orgs?.[0]?.id);

        if (!orgs?.length) {
          this.authService.me(accessToken).pipe(
            catchError(() => of(null))
          ).subscribe((profile: any) => {
            const profileOrgs = profile?.organizations || [];
            if (profileOrgs?.[0]?.id) {
              storeOrgId(profileOrgs[0].id);
            }
            this.isLoading = false;
            this.router.navigate(['/']);
          });
        } else {
          this.isLoading = false;
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.isLoading = false;
        
        if (err.status === 401) {
          this.errorMessage = 'Invalid email or password. Please try again.';
        } else if (err.status === 400) {
          this.errorMessage = err.error?.detail || 'Please check your input and try again.';
        } else {
          this.errorMessage = 'An error occurred. Please try again later.';
        }
      }
    });
  }
}
