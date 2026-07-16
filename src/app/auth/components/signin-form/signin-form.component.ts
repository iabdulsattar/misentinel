import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService, ServiceAccessGrant } from '../../../core/services/permission.service';
import { Router } from '@angular/router';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { CheckboxComponent } from '../../../shared/components/form/input/checkbox.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';

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

  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private router: Router,
  ) {}

  showPassword = false;
  isChecked = false;

  email = '';
  password = '';

  isLoading = false;
  errorMessage = '';
  emailError = '';
  passwordError = '';

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private decodeExp(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  private validateForm(): boolean {
    let isValid = true;
    this.emailError = '';
    this.passwordError = '';

    if (!this.email.trim()) {
      this.emailError = 'Email is required';
      isValid = false;
    }

    if (!this.password) {
      this.passwordError = 'Password is required';
      isValid = false;
    }

    return isValid;
  }

  onSignIn() {
    this.isLoading = true;
    this.errorMessage = '';
    this.emailError = '';
    this.passwordError = '';

    if (!this.validateForm()) {
      this.isLoading = false;
      return;
    }

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

        const exp = this.decodeExp(accessToken);
        const expiresAt = String(exp ?? Date.now() + 24 * 60 * 60 * 1000);

        localStorage.setItem('access_token_saas', accessToken);
        localStorage.setItem('refresh_token', refreshToken ?? '');

        if (this.isChecked) {
          localStorage.setItem('remember_device', 'true');
          localStorage.setItem('session_expires_at', expiresAt);
        } else {
          localStorage.removeItem('remember_device');
          localStorage.removeItem('session_expires_at');
          sessionStorage.setItem('access_token_saas', accessToken);
          sessionStorage.setItem('refresh_token', refreshToken ?? '');
          sessionStorage.setItem('session_expires_at', expiresAt);
        }

        const orgs = data?.tokens?.organizations ?? data?.organizations ?? [];
        const storeOrg = (id: string, name?: string) => {
          localStorage.setItem('org_id', id);
          localStorage.setItem('organizationId', id);
          if (name) {
            localStorage.setItem('organizationName', name);
            localStorage.setItem('org_name', name);
          }
        };
        if (orgs?.length > 0) {
          storeOrg(orgs[0].id, orgs[0].name);
        } else {
          this.authService.me(accessToken).subscribe({
            next: (profile: any) => {
              const profileOrgs = profile?.organizations ?? [];
              if (profileOrgs?.length > 0) {
                storeOrg(profileOrgs[0].id, profileOrgs[0].name);
              }
            },
            error: () => {
            }
          });
        }

        this.permissionService.setServiceAccess((data?.serviceAccess as ServiceAccessGrant[]) ?? data?.tokens?.serviceAccess);

        this.isLoading = false;
        this.router.navigate(['/']);
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
