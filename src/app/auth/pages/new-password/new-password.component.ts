import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-new-password',
  templateUrl: './new-password.component.html',
  styles: '',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class NewPasswordComponent {
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  token = '';
  newPassword = '';
  confirmPassword = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    // Backend sometimes uses different query param keys. Support common variants.
    this.token =
      this.route.snapshot.queryParamMap.get('token') ||
      this.route.snapshot.queryParamMap.get('resetToken') ||
      this.route.snapshot.queryParamMap.get('reset_token') ||
      this.route.snapshot.queryParamMap.get('reset-password-token') ||
      '';
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const newPassword = this.newPassword?.trim();
    const confirmPassword = this.confirmPassword?.trim();

    if (!this.token) {
      this.isLoading = false;
      this.errorMessage = 'Reset token is missing from the URL. Example: /reset-password?token=...';
      return;
    }


    if (!newPassword || newPassword.length < 6) {
      this.isLoading = false;
      this.errorMessage = 'Please enter a valid new password.';
      return;
    }

    if (newPassword !== confirmPassword) {
      this.isLoading = false;
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.authService
      .resetPassword({ token: this.token, newPassword })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Password updated successfully.';
          this.router.navigate(['/signin']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.detail || 'Failed to update password. Please try again.';
        }
      });
  }
}

