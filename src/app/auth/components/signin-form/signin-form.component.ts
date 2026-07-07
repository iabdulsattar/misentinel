import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
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

        localStorage.setItem('access_token_saas', accessToken);
        localStorage.setItem('refresh_token', refreshToken ?? '');

        const orgs = data?.organizations ?? [];
        if (orgs?.length > 0) {
          localStorage.setItem('org_id', orgs[0].id);
        }

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
