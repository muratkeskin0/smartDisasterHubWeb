import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TextAnalysisService } from '../../../core/services/text-analysis.service';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { TranslocoPipe } from '@jsverse/transloco';

export interface DashboardLocationRow {
  title: string;
  locationText?: string | null;
  lat?: number | null;
  lng?: number | null;
  url: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AppHeaderComponent, TranslocoPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private textAnalysisService = inject(TextAnalysisService);

  /** Recent disaster-related posts that have extracted location text or coordinates */
  locationRows: DashboardLocationRow[] = [];
  locationsLoading = false;
  locationsLoaded = false;
  locationsError = false;
  
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

  ngOnInit(): void {
    this.loadRecentLocations();
  }

  private loadRecentLocations(): void {
    this.locationsLoading = true;
    this.locationsError = false;
    // All analyzed posts (not only disaster-related) so rows with location in DB show up
    this.textAnalysisService.getAnalyzedPosts(0, 60, 'redditCreatedAt', 'DESC').subscribe({
      next: (response) => {
        this.locationsLoading = false;
        this.locationsLoaded = true;
        if (!response.success || !response.data?.content) {
          this.locationRows = [];
          return;
        }
        const posts = response.data.content;
        this.locationRows = posts
          .filter(
            p =>
              (p.locationText && p.locationText.trim().length > 0) ||
              (p.latitude != null &&
                p.longitude != null &&
                !Number.isNaN(Number(p.latitude)) &&
                !Number.isNaN(Number(p.longitude)))
          )
          .slice(0, 6)
          .map(p => ({
            title: p.title,
            locationText: p.locationText,
            lat: p.latitude,
            lng: p.longitude,
            url: p.url
          }));
      },
      error: () => {
        this.locationsLoading = false;
        this.locationsLoaded = true;
        this.locationsError = true;
        this.locationRows = [];
      }
    });
  }

  hasCoords(row: DashboardLocationRow): boolean {
    return (
      row.lat != null &&
      row.lng != null &&
      !Number.isNaN(Number(row.lat)) &&
      !Number.isNaN(Number(row.lng))
    );
  }

  osmLink(row: DashboardLocationRow): string {
    const lat = Number(row.lat);
    const lon = Number(row.lng);
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`;
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
