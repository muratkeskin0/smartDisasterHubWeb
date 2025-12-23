import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AppHeaderComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  private authService = inject(AuthService);
  
  currentUser$ = this.authService.currentUser$;
  isAuthenticated = computed(() => this.authService.isAuthenticated);
  userFullName = computed(() => this.authService.userFullName);

  get userInitials(): string {
    const user = this.authService.currentUserValue;
    if (!user) return '?';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  get firstName(): string {
    return this.authService.currentUserValue?.firstName || '';
  }

  get user() {
    return this.authService.currentUserValue;
  }

  get roleClass(): string {
    return this.authService.isAdmin ? 'role-admin' : 'role-basic';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  handleLogout(): void {
    this.authService.logout();
  }
}
