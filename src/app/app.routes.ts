import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
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
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    title: 'Dashboard - Smart Disaster Hub'
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    title: 'Profile - Smart Disaster Hub'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
