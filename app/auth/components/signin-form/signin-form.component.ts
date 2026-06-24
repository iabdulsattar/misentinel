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

    this.authService.login({ username: this.email, password: this.password }).subscribe({
      next: (res) => {
        console.log('Login successful:', res);
        localStorage.setItem('access_token_saas', res.access_token);
        localStorage.setItem('refresh_token', res.refresh_token);
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
