import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, BackButtonComponent, TranslocoPipe, LanguageSwitcherComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent {
  private authService = inject(AuthService);
  private transloco = inject(TranslocoService);
  
  currentUser$ = this.authService.currentUser$;
  userFullName = computed(() => this.authService.userFullName);

  get userInitials(): string {
    const user = this.authService.currentUserValue;
    if (!user) return '?';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
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
    const locale = this.transloco.getActiveLang() === 'tr' ? 'tr-TR' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
