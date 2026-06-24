import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { CheckboxComponent } from '../../../shared/components/form/input/checkbox.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verification-form',
  imports: [
    RouterModule,
    FormsModule,
    InputFieldComponent,
    LabelComponent,
    ButtonComponent,
    CheckboxComponent,
  ],
  templateUrl: './verification-form.component.html',
  styles: ''
})
export class VerificationFormComponent {
  isCheckedOne = false;

  // Email to verify
  email = '';

  // 6 separate digits (bound from the template)
  d1 = '';
  d2 = '';
  d3 = '';
  d4 = '';
  d5 = '';
  d6 = '';

  get code(): string {
    return `${this.d1}${this.d2}${this.d3}${this.d4}${this.d5}${this.d6}`;
  }


  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService) {}

  onSignIn() {
    // Postman: POST /api/v1/auth/signup/verify-otp { email, code }
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const otp = this.code?.trim();
    if (!this.email?.trim() || !otp || otp.length < 4) {
      this.isLoading = false;
      this.errorMessage = 'Enter a valid email and verification code.';
      return;
    }

    this.authService.verifySignupOtp({ email: this.email, code: otp }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Email verified successfully.';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || 'Verification failed. Please try again.';
      }
    });
  }
}

