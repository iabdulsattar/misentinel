import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { SigninFormComponent } from './components/signin-form/signin-form.component';
import { SignupFormComponent } from './components/signup-form/signup-form.component';
import { ForgotpasswordFormComponent } from './components/forgotpassword-form/forgotpassword-form.component';
import { SubscriptionPlanComponent } from './pages/subscription-plan/subscription-plan.component';
import { NewPasswordComponent } from './pages/new-password/new-password.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SharedModule,
    SignInComponent,
    SignUpComponent,
    ForgotPasswordComponent,
    SigninFormComponent,
    SignupFormComponent,
    ForgotpasswordFormComponent,
    SubscriptionPlanComponent,
    NewPasswordComponent
  ]
})
export class AuthModule { }
