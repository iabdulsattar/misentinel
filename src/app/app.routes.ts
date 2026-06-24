import { Routes } from '@angular/router';
import { EcommerceComponent } from './dashboard/pages/ecommerce/ecommerce.component';
import { ProfileComponent } from './dashboard/pages/profile/profile.component';
import { FormElementsComponent } from './features/pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './features/pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './features/pages/blank/blank.component';
import { NotFoundComponent } from './features/pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { InvoicesComponent } from './features/pages/invoices/invoices.component';
import { LineChartComponent } from './features/pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './features/pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './ui-elements/pages/alerts/alerts.component';
import { AvatarElementComponent } from './ui-elements/pages/avatar-element/avatar-element.component';
import { BadgesComponent } from './ui-elements/pages/badges/badges.component';
import { ButtonsComponent } from './ui-elements/pages/buttons/buttons.component';
import { ImagesComponent } from './ui-elements/pages/images/images.component';
import { VideosComponent } from './ui-elements/pages/videos/videos.component';
import { SignInComponent } from './auth/pages/sign-in/sign-in.component';
import { ForgotPasswordComponent } from './auth/pages/forgot-password/forgot-password.component';
import { ForgotPasswordcheckComponent } from './auth/pages/forgot-passwordcheck/forgot-passwordcheck.component';
import { VerificationComponent } from './auth/pages/verification/verification.component';
import { NewPasswordComponent } from './auth/pages/new-password/new-password.component';


import { SignUpComponent } from './auth/pages/sign-up/sign-up.component';
import { CalenderComponent } from './dashboard/pages/calender/calender.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path:'',
    component:AppLayoutComponent,
    canActivate: [authGuard],
    children:[
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title:
          'Dashboard | eDOB',
      },
      {
        path:'calendar',
        component:CalenderComponent,
        title:'Angular Calender | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'profile',
        component:ProfileComponent,
        title:'Angular Profile Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'form-elements',
        component:FormElementsComponent,
        title:'Angular Form Elements Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'basic-tables',
        component:BasicTablesComponent,
        title:'Angular Basic Tables Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'blank',
        component:BlankComponent,
        title:'Angular Blank Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      // support tickets
      {
        path:'invoice',
        component:InvoicesComponent,
        title:'Angular Invoice Details Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'line-chart',
        component:LineChartComponent,
        title:'Angular Line Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'bar-chart',
        component:BarChartComponent,
        title:'Angular Bar Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'alerts',
        component:AlertsComponent,
        title:'Angular Alerts Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'avatars',
        component:AvatarElementComponent,
        title:'Angular Avatars Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'badge',
        component:BadgesComponent,
        title:'Angular Badges Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'buttons',
        component:ButtonsComponent,
        title:'Angular Buttons Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'images',
        component:ImagesComponent,
        title:'Angular Images Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'videos',
        component:VideosComponent,
        title:'Angular Videos Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
    ]
  },
  // auth pages
  {
    path:'signin',
    component:SignInComponent,
    title:'Sign In | eDOB'
  },
  {
    path:'forgot-password',
    component:ForgotPasswordComponent,
    title:'Forgot Password | eDOB'
  },
  {
    path:'forgot-passwordcheck',
    component:ForgotPasswordcheckComponent,
    title:'Forgot Password | eDOB'
  },
  {
    path:'reset-password',
    component:NewPasswordComponent,
    title:'Reset Password | eDOB'
  },
  {
    path:'verification',
    component:VerificationComponent,
    title:'Verification | eDOB'
  },

  {
    path:'signup',
    component:SignUpComponent,
    title:'Sign Up | eDOB'
  },
  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'Angular NotFound Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
];
