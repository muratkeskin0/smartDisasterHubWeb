import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
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
    path: 'text-analysis',
    loadComponent: () => import('./features/text-analysis/text-analysis/text-analysis').then(m => m.TextAnalysisComponent),
    canActivate: [authGuard],
    title: 'Text Analysis - Smart Disaster Hub'
  },
  {
    path: 'map',
    loadComponent: () => import('./features/map/map/map').then(m => m.MapComponent),
    canActivate: [authGuard],
    title: 'Disaster Map - Smart Disaster Hub'
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
