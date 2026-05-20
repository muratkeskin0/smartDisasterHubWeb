import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing/landing').then(m => m.LandingComponent),
    title: 'Smart Disaster Hub - Intelligent Disaster Detection'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent),
    canActivate: [guestGuard],
    title: 'Sign In - Smart Disaster Hub'
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent),
    canActivate: [guestGuard],
    title: 'Sign Up - Smart Disaster Hub'
  },
  {
    path: 'activation-mail-sent',
    loadComponent: () => import('./features/auth/activation-mail-sent/activation-mail-sent').then(m => m.ActivationMailSentComponent),
    canActivate: [guestGuard],
    title: 'Activation Mail Sent - Smart Disaster Hub'
  },
  {
    path: 'activate-email',
    loadComponent: () => import('./features/auth/activate-email/activate-email').then(m => m.ActivateEmailComponent),
    canActivate: [guestGuard],
    title: 'Activate Email - Smart Disaster Hub'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard, adminGuard],
    title: 'Dashboard - Smart Disaster Hub'
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard, adminGuard],
    title: 'Profile - Smart Disaster Hub'
  },
  {
    path: 'text-analysis/post/:redditPostId',
    loadComponent: () =>
      import('./features/text-analysis/post-analysis-detail/post-analysis-detail').then(m => m.PostAnalysisDetailComponent),
    canActivate: [authGuard, adminGuard],
    title: 'Post analysis - Smart Disaster Hub'
  },
  {
    path: 'text-analysis',
    loadComponent: () => import('./features/text-analysis/text-analysis/text-analysis').then(m => m.TextAnalysisComponent),
    canActivate: [authGuard, adminGuard],
    title: 'Text Analysis - Smart Disaster Hub'
  },
  {
    path: 'moderation',
    loadComponent: () => import('./features/moderation/moderation/moderation').then(m => m.ModerationComponent),
    canActivate: [authGuard, adminGuard],
    title: 'Moderation - Smart Disaster Hub'
  },
  {
    path: 'map',
    loadComponent: () => import('./features/map/map/map').then(m => m.MapComponent),
    canActivate: [authGuard, adminGuard],
    title: 'Disaster Map - Smart Disaster Hub'
  },
  {
    path: 'reddit-authors',
    redirectTo: 'authors',
    pathMatch: 'full'
  },
  {
    path: 'authors',
    loadComponent: () => import('./features/authors/authors/authors').then(m => m.AuthorsComponent),
    canActivate: [authGuard, adminGuard],
    title: 'Authors - Smart Disaster Hub'
  },
  {
    path: 'reports',
    loadComponent: () => import('./features/reports/reports/reports').then(m => m.ReportsComponent),
    canActivate: [authGuard, adminGuard],
    title: 'Reports - Smart Disaster Hub'
  },
  {
    path: 'reports/charts',
    loadComponent: () => import('./features/reports/reports/reports').then(m => m.ReportsComponent),
    canActivate: [authGuard, adminGuard],
    data: { reportView: 'charts' },
    title: 'Reports Charts - Smart Disaster Hub'
  },
  {
    path: 'reports/tables',
    loadComponent: () => import('./features/reports/reports/reports').then(m => m.ReportsComponent),
    canActivate: [authGuard, adminGuard],
    data: { reportView: 'tables' },
    title: 'Reports Tables - Smart Disaster Hub'
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about/about').then(m => m.AboutComponent),
    canActivate: [authGuard],
    title: 'About - Smart Disaster Hub'
  },
  {
    path: '**',
    redirectTo: '/'
  }
];
