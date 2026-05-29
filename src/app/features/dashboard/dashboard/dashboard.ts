import { Component, OnInit, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TextAnalysisService } from '../../../core/services/text-analysis.service';
import { StaffInboxService } from '../../../core/services/staff-inbox.service';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { AppTipComponent } from '../../../shared/components/app-tip/app-tip';
import { TranslocoPipe } from '@jsverse/transloco';
import { PostTitlePipe } from '../../../shared/pipes/post-title.pipe';
import { isPostTitleBlank } from '../../../core/utils/post-display';

export interface DashboardLocationRow {
  title: string;
  locationText?: string | null;
  lat?: number | null;
  lng?: number | null;
  url: string;
}

export type DashboardModuleIcon =
  | 'moderation'
  | 'analysis'
  | 'map'
  | 'authors'
  | 'profile'
  | 'complaints'
  | 'team'
  | 'reports';

export interface DashboardModule {
  route: string | string[];
  titleKey: string;
  descKey: string;
  icon: DashboardModuleIcon;
  accent?: 'warning';
  badgeKey?: 'moderation' | 'complaints';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AppHeaderComponent, AppTipComponent, TranslocoPipe, PostTitlePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private textAnalysisService = inject(TextAnalysisService);
  private staffInbox = inject(StaffInboxService);

  pendingModerationCount = 0;
  pendingComplaintCount = 0;

  readonly isPostTitleBlank = isPostTitleBlank;

  constructor() {
    effect(() => {
      this.pendingModerationCount = this.staffInbox.moderationNavBadge(true);
      this.pendingComplaintCount = this.staffInbox.complaintNavBadge(true);
    });
  }

  /** Recent disaster-related posts that have extracted location text or coordinates */
  locationRows: DashboardLocationRow[] = [];
  locationsLoading = false;
  locationsLoaded = false;
  locationsError = false;

  currentUser$ = this.authService.currentUser$;
  isAuthenticated = computed(() => this.authService.isAuthenticated);
  userFullName = computed(() => this.authService.userFullName);

  readonly modules: DashboardModule[] = [
    {
      route: '/moderation',
      titleKey: 'dashboard.featureModerationTitle',
      descKey: 'dashboard.featureModerationDesc',
      icon: 'moderation',
      accent: 'warning',
      badgeKey: 'moderation'
    },
    {
      route: '/complaints/inbox',
      titleKey: 'dashboard.featureComplaintsTitle',
      descKey: 'dashboard.featureComplaintsDesc',
      icon: 'complaints',
      badgeKey: 'complaints'
    },
    {
      route: '/text-analysis',
      titleKey: 'dashboard.featureTextAnalysisTitle',
      descKey: 'dashboard.featureTextAnalysisDesc',
      icon: 'analysis'
    },
    {
      route: '/map',
      titleKey: 'dashboard.featureMapTitle',
      descKey: 'dashboard.featureMapDesc',
      icon: 'map'
    },
    {
      route: '/authors',
      titleKey: 'dashboard.featureAuthorsTitle',
      descKey: 'dashboard.featureAuthorsDesc',
      icon: 'authors'
    },
    {
      route: '/reports/charts',
      titleKey: 'dashboard.featureReportsTitle',
      descKey: 'dashboard.featureReportsDesc',
      icon: 'reports'
    },
    {
      route: '/team',
      titleKey: 'dashboard.featureTeamTitle',
      descKey: 'dashboard.featureTeamDesc',
      icon: 'team'
    },
    {
      route: '/profile',
      titleKey: 'dashboard.featureProfileTitle',
      descKey: 'dashboard.featureProfileDesc',
      icon: 'profile'
    }
  ];

  get firstName(): string {
    return this.authService.currentUserValue?.firstName || '';
  }

  ngOnInit(): void {
    this.staffInbox.refresh();
    this.loadRecentLocations();
  }

  moduleBadge(mod: DashboardModule): number {
    if (mod.badgeKey === 'moderation') {
      return this.pendingModerationCount;
    }
    if (mod.badgeKey === 'complaints') {
      return this.pendingComplaintCount;
    }
    return 0;
  }

  private loadRecentLocations(): void {
    this.locationsLoading = true;
    this.locationsError = false;
    this.textAnalysisService.getAnalyzedPosts(0, 60, 'redditCreatedAt', 'DESC').subscribe({
      next: response => {
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
}
