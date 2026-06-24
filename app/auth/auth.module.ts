import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ForgotPasswordcheckComponent } from './pages/forgot-passwordcheck/forgot-passwordcheck.component';
import { VerificationComponent } from './pages/verification/verification.component';
import { NewPasswordComponent } from './pages/new-password/new-password.component';
import { SigninFormComponent } from './components/signin-form/signin-form.component';
import { SignupFormComponent } from './components/signup-form/signup-form.component';
import { ForgotpasswordFormComponent } from './components/forgotpassword-form/forgotpassword-form.component';


@NgModule({
  declarations: [
    SignInComponent,
    SignUpComponent,
    ForgotPasswordComponent,
    ForgotPasswordcheckComponent,
    VerificationComponent,
    NewPasswordComponent,
    SigninFormComponent,
    SignupFormComponent,
    ForgotpasswordFormComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SharedModule
  ]

  // No standalone components here; templates must resolve via declarations/imports.

})
export class AuthModule { }
