import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { PermissionService, ServiceAccessGrant } from '../../../../core/services/permission.service';
import { SubscriptionService, SERVICE_CODE } from '../../../../core/services/subscription.service';
import { Router, ActivatedRoute } from '@angular/router';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';

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
export class SigninFormComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private subscriptionService: SubscriptionService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
  }

  showPassword = false;
  isChecked = false;

  email = '';
  password = '';

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  emailError = '';
  passwordError = '';

  // ---- OTP (2FA) step ----
  requiresOtp = false;
  challengeToken = '';
  otpSentTo = '';
  d1 = '';
  d2 = '';
  d3 = '';
  d4 = '';
  d5 = '';
  d6 = '';
  digitError = false;

  get otpCode(): string {
    return [this.d1, this.d2, this.d3, this.d4, this.d5, this.d6].map(d => (d ?? '').toString()).join('');
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private resetOtpStep() {
    this.d1 = this.d2 = this.d3 = this.d4 = this.d5 = this.d6 = '';
    this.digitError = false;
  }

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\s+/g, '');
    const digits = pasted.replace(/\D/g, '').slice(0, 6);
    if (digits.length !== 6) return;
    this.d1 = digits[0];
    this.d2 = digits[1];
    this.d3 = digits[2];
    this.d4 = digits[3];
    this.d5 = digits[4];
    this.d6 = digits[5];
  }

  backToSignIn() {
    this.requiresOtp = false;
    this.challengeToken = '';
    this.errorMessage = '';
    this.resetOtpStep();
  }

  resendOtp() {
    if (!this.email.trim()) {
      this.errorMessage = 'Email is missing. Please go back and try again.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.login({ email: this.email, password: this.password, serviceCode: SERVICE_CODE }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.challengeToken) {
          this.challengeToken = res.challengeToken;
        }
        this.resetOtpStep();
        this.successMessage = 'A new verification code has been sent to your email.';
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to resend the code. Please try again.';
      }
    });
  }

  onVerifyOtp() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.digitError = false;

    const code = this.otpCode.replace(/\s+/g, '').trim();
    if (!/^\d{6}$/.test(code)) {
      this.isLoading = false;
      this.digitError = true;
      this.errorMessage = 'Enter the 6-digit verification code.';
      return;
    }

    this.authService.verify2fa({ challengeToken: this.challengeToken, code }).subscribe({
      next: (res: any) => {
        const accessToken = res?.access_token ?? res?.tokens?.access_token;
        const refreshToken = res?.refresh_token ?? res?.tokens?.refresh_token;
        if (!accessToken) {
          this.isLoading = false;
          this.errorMessage = 'Verification succeeded but no access token was returned. Please contact support.';
          return;
        }
        this.finalizeLogin(res);
      },
      error: (err: any) => {
        this.isLoading = false;
        const detail = err?.error?.detail || err?.error?.message;
        this.errorMessage = detail ? `Verification failed: ${detail}` : 'Invalid or expired code. Please try again.';
      }
    });
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
    this.successMessage = '';
    this.emailError = '';
    this.passwordError = '';

    if (!this.validateForm()) {
      this.isLoading = false;
      return;
    }

    this.authService.login({ email: this.email, password: this.password, serviceCode: SERVICE_CODE }).subscribe({
      next: (res) => {
        const data = res as any;

        if (data?.requiresOtp || data?.challengeToken) {
          this.requiresOtp = true;
          this.challengeToken = data?.challengeToken ?? '';
          this.otpSentTo = this.email;
          this.resetOtpStep();
          this.isLoading = false;
          return;
        }

        this.finalizeLogin(data);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.isLoading = false;

        if (this.isEmailNotVerifiedError(err)) {
          const email = this.email.trim();
          localStorage.setItem('verification_email', email);
          this.authService.resendSignupOtp({ email }).subscribe({
            complete: () => this.router.navigate(['/verification']),
          });
          return;
        }

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

  private static readonly LOGIN_PLAN_ID = '90c7dcff-f7d6-42c4-9b72-292d8f6e7793';

  private finalizeLogin(data: any) {
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
    const storeOrgAndProceed = (id: string, name?: string) => {
      localStorage.setItem('org_id', id);
      localStorage.setItem('organizationId', id);
      if (name) {
        localStorage.setItem('organizationName', name);
        localStorage.setItem('org_name', name);
      }
      if (data?.subscribedServices) {
        localStorage.setItem('subscribed_services', JSON.stringify(data.subscribedServices));
      }
      this.permissionService.setServiceAccess((data?.serviceAccess as ServiceAccessGrant[]) ?? data?.tokens?.serviceAccess);
      this.isLoading = false;
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
      this.startTrialIfNeeded(data, returnUrl);
    };
    if (orgs?.length > 0) {
      storeOrgAndProceed(orgs[0].id, orgs[0].name);
    } else {
      this.authService.me(accessToken).subscribe({
        next: (profile: any) => {
          const profileOrgs = profile?.organizations ?? [];
          if (profileOrgs?.length > 0) {
            storeOrgAndProceed(profileOrgs[0].id, profileOrgs[0].name);
          } else {
            this.permissionService.setServiceAccess((data?.serviceAccess as ServiceAccessGrant[]) ?? data?.tokens?.serviceAccess);
            this.isLoading = false;
            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
            this.startTrialIfNeeded(data, returnUrl);
          }
        },
        error: () => {
          this.permissionService.setServiceAccess((data?.serviceAccess as ServiceAccessGrant[]) ?? data?.tokens?.serviceAccess);
          this.isLoading = false;
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
          this.startTrialIfNeeded(data, returnUrl);
        }
      });
    }
  }

  private startTrialIfNeeded(data: any, returnUrl: string): void {
    const orgId = localStorage.getItem('org_id') || localStorage.getItem('organizationId');
    if (!orgId) {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    // Check if edob service is already subscribed and active from login response
    const subscribedServices = data?.subscribedServices ?? [];
    const edobService = subscribedServices.find((s: any) => s?.serviceCode === SERVICE_CODE);
    if (edobService) {
      if (!edobService.webAccess) {
        // User is subscribed but does not have web access — show message
        this.isLoading = false;
        this.errorMessage = 'Your account is not currently assigned access to this application. Please contact your administrator to request access.';
        this.authService.clearTokens();
        return;
      }
      if (edobService.active) {
        this.router.navigateByUrl(returnUrl);
        return;
      }
    }

    const accessToken = data?.tokens?.access_token ?? data?.access_token;
    this.subscriptionService.checkSubscription(orgId, SERVICE_CODE).subscribe({
      next: (check) => {
        if (check?.active) {
          this.subscriptionService.enableService(orgId, SERVICE_CODE, accessToken).subscribe({
            next: () => this.router.navigateByUrl(returnUrl),
            error: () => this.router.navigateByUrl(returnUrl)
          });
          return;
        }
        this.subscriptionService.startSubscription(orgId, {
          planId: SigninFormComponent.LOGIN_PLAN_ID,
          billingPeriod: 'MONTHLY',
          useTrial: true,
          config: {}
        }, SERVICE_CODE, accessToken).subscribe({
          next: () => {
            this.subscriptionService.enableService(orgId, SERVICE_CODE, accessToken).subscribe({
              next: () => this.router.navigateByUrl(returnUrl),
              error: () => this.router.navigateByUrl(returnUrl)
            });
          },
          error: () => {
            this.router.navigateByUrl(returnUrl);
          }
        });
      },
      error: () => {
        this.router.navigateByUrl(returnUrl);
      }
    });
  }

  private isEmailNotVerifiedError(err: any): boolean {
    if (err?.status !== 403) return false;
    const source = err?.error?.message ?? err?.error?.detail ?? '';
    return source?.toString().toLowerCase().includes('email not verified');
  }
}

