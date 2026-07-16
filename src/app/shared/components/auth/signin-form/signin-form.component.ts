
import { Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { PermissionService, ServiceAccessGrant } from '../../../../core/services/permission.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin-form',
  imports: [
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule
],
  templateUrl: './signin-form.component.html',
  styles: ``
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

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        console.log('Login successful:', res);
        localStorage.setItem('access_token_saas', res.tokens.access_token);
        localStorage.setItem('refresh_token', res.tokens.refresh_token);

        const data = res as any;
        const orgs = data?.tokens?.organizations ?? data?.organizations ?? [];
        if (orgs?.length > 0) {
          localStorage.setItem('org_id', orgs[0].id);
          localStorage.setItem('organizationId', orgs[0].id);
          const orgName = orgs[0].name;
          if (orgName) {
            localStorage.setItem('organizationName', orgName);
            localStorage.setItem('org_name', orgName);
          }
        }
        this.permissionService.setServiceAccess((data?.serviceAccess as ServiceAccessGrant[]) ?? data?.tokens?.serviceAccess);
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Login error:', err);
      }
    });
  }
}
