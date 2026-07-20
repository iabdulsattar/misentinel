import { Component } from '@angular/core';
import { ForgotpasswordFormComponent } from '../../../shared/components/auth/forgotpassword-form/forgotpassword-form.component';
import { AuthPageLayoutComponent } from '../../../layout/auth-page-layout/auth-page-layout.component';

@Component({
  selector: 'app-forgot-password',
  imports: [
    ForgotpasswordFormComponent,
    AuthPageLayoutComponent
  ],
  templateUrl: './forgot-password.component.html',
  styles: ''
})
export class ForgotPasswordComponent {

}
