import { Routes, PreloadAllModules } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
      {
        path:'',
        loadComponent: () => import('./layout/app-layout/app-layout.component').then(m => m.AppLayoutComponent),
        canActivate: [authGuard],
        children:[
          {
            path: '',
            loadComponent: () => import('./dashboard/dashboard-shell/dashboard-shell.component').then(m => m.DashboardShellComponent),
            pathMatch: 'full',
            title:
              'Dashboard | eDOB',
          },
          {
            path: 'dashboard',
            loadComponent: () => import('./dashboard/dashboard-shell/dashboard-shell.component').then(m => m.DashboardShellComponent),
            title: 'Dashboard | eDOB'
          },
          {
            path: 'dob-feed',
            redirectTo: 'entries',
            pathMatch: 'full'
          },
          {
            path: 'entries',
            loadComponent: () => import('./dob-feed/entries.component').then(m => m.EntriesComponent),
            title: 'Entries | eDOB'
          },
          {
            path: 'create-entry',
            loadComponent: () => import('./dob-feed/create-entry/create-entry.component').then(m => m.CreateEntryComponent),
            title: 'Create Entry | eDOB'
          },
          {
            path:'calendar',
            loadComponent: () => import('./dashboard/pages/calender/calender.component').then(m => m.CalenderComponent),
            title:'Angular Calender | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'profile',
            loadComponent: () => import('./dashboard/pages/profile/profile.component').then(m => m.ProfileComponent),
            title:'Angular Profile Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'form-elements',
            loadComponent: () => import('./features/pages/forms/form-elements/form-elements.component').then(m => m.FormElementsComponent),
            title:'Angular Form Elements Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'basic-tables',
            loadComponent: () => import('./features/pages/tables/basic-tables/basic-tables.component').then(m => m.BasicTablesComponent),
            title:'Angular Basic Tables Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'blank',
            loadComponent: () => import('./features/pages/blank/blank.component').then(m => m.BlankComponent),
            title:'Angular Blank Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'invoice',
            loadComponent: () => import('./features/pages/invoices/invoices.component').then(m => m.InvoicesComponent),
            title:'Angular Invoice Details Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'line-chart',
            loadComponent: () => import('./features/pages/charts/line-chart/line-chart.component').then(m => m.LineChartComponent),
            title:'Angular Line Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'bar-chart',
            loadComponent: () => import('./features/pages/charts/bar-chart/bar-chart.component').then(m => m.BarChartComponent),
            title:'Angular Bar Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'alerts',
            loadComponent: () => import('./ui-elements/pages/alerts/alerts.component').then(m => m.AlertsComponent),
            title:'Angular Alerts Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'avatars',
            loadComponent: () => import('./ui-elements/pages/avatar-element/avatar-element.component').then(m => m.AvatarElementComponent),
            title:'Angular Avatars Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'badge',
            loadComponent: () => import('./ui-elements/pages/badges/badges.component').then(m => m.BadgesComponent),
            title:'Angular Badges Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'buttons',
            loadComponent: () => import('./ui-elements/pages/buttons/buttons.component').then(m => m.ButtonsComponent),
            title:'Angular Buttons Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'images',
            loadComponent: () => import('./ui-elements/pages/images/images.component').then(m => m.ImagesComponent),
            title:'Angular Images Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'videos',
            loadComponent: () => import('./ui-elements/pages/videos/videos.component').then(m => m.VideosComponent),
            title:'Angular Videos Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
      ]
  },
  // auth pages
  {
    path:'signin',
    loadComponent: () => import('./auth/pages/sign-in/sign-in.component').then(m => m.SignInComponent),
    title:'Sign In | eDOB'
  },
  {
    path:'forgot-password',
    loadComponent: () => import('./auth/pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title:'Forgot Password | eDOB'
  },
  {
    path:'forgot-passwordcheck',
    loadComponent: () => import('./auth/pages/forgot-passwordcheck/forgot-passwordcheck.component').then(m => m.ForgotPasswordcheckComponent),
    title:'Forgot Password | eDOB'
  },
  {
    path:'confirm-password',
    loadComponent: () => import('./auth/pages/confirm-password/confirm-password.component').then(m => m.ConfirmPasswordComponent),
    title:'Confirm Password | eDOB'
  },
  {
    path:'reset-password',
    loadComponent: () => import('./auth/pages/new-password/new-password.component').then(m => m.NewPasswordComponent),
    title:'Reset Password | eDOB'
  },
  {
    path:'verification',
    loadComponent: () => import('./auth/pages/verification/verification.component').then(m => m.VerificationComponent),
    title:'Verification | eDOB'
  },
  {
    path:'subscription-plan',
    loadComponent: () => import('./auth/pages/subscription-plan/subscription-plan.component').then(m => m.SubscriptionPlanComponent),
    title:'Choose Plan | eDOB'
  },
  {
    path:'signup',
    loadComponent: () => import('./auth/pages/sign-up/sign-up.component').then(m => m.SignUpComponent),
    title:'Sign Up | eDOB'
  },
  // error pages
  {
    path:'**',
    loadComponent: () => import('./features/pages/other-page/not-found/not-found.component').then(m => m.NotFoundComponent),
    title:'Angular NotFound Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
];
