import { Component } from '@angular/core';
import { SigninFormComponent } from '../../components/signin-form/signin-form.component';
import { AuthPageLayoutComponent } from '../../../layout/auth-page-layout/auth-page-layout.component';

@Component({
  selector: 'app-sign-in',
  imports: [
    SigninFormComponent,
    AuthPageLayoutComponent,
  ],
  templateUrl: './sign-in.component.html',
  styles: ``
})
export class SignInComponent {

}
