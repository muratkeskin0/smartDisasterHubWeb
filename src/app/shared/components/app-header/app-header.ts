import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BaseButtonComponent } from '../base-button/base-button';
import { TranslocoPipe } from '@jsverse/transloco';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseButtonComponent, TranslocoPipe, LanguageSwitcherComponent],
  templateUrl: './app-header.html',
  styleUrl: './app-header.css'
})
export class AppHeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  currentUser$ = this.authService.currentUser$;
  isAuthenticated = computed(() => this.authService.isAuthenticated);
  userFullName = computed(() => this.authService.userFullName);

  get userInitials(): string {
    const user = this.authService.currentUserValue;
    if (!user) return '';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
