import { Component } from '@angular/core';
import { AuthPageLayoutComponent } from '../../../../layout/auth-page-layout/auth-page-layout.component';
import { ForgotpasswordFormComponent } from '../../../../shared/components/auth/forgotpassword-form/forgotpassword-form.component';

@Component({
  selector: 'app-forgot-password',
  imports: [
    AuthPageLayoutComponent,
    ForgotpasswordFormComponent
  ],
  templateUrl: './forgot-password.component.html',
  styles: ''
})
export class ForgotPasswordComponent {

}
