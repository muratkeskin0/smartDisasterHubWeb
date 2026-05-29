import { Component, computed, inject, OnDestroy, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { TranslocoPipe } from '@jsverse/transloco';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher';
import { StaffInboxService } from '../../../core/services/staff-inbox.service';
import { AppLogoComponent } from '../app-logo/app-logo';

export type HeaderNavIcon =
  | 'home'
  | 'dashboard'
  | 'analysis'
  | 'moderation'
  | 'complaints'
  | 'complaintNew'
  | 'map'
  | 'authors'
  | 'team'
  | 'reports'
  | 'about'
  | 'signIn'
  | 'register';

export interface HeaderNavItem {
  route: string | string[];
  labelKey: string;
  icon: HeaderNavIcon;
  exact?: boolean;
  badge?: () => number;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoPipe, LanguageSwitcherComponent, AppLogoComponent],
  templateUrl: './app-header.html',
  styleUrl: './app-header.css'
})
export class AppHeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private staffInbox = inject(StaffInboxService);

  isAuthenticated = computed(() => this.authService.isAuthenticated);
  isAdmin = computed(() => this.authService.isAdmin);
  isStaff = computed(() => this.authService.isStaff);
  userFullName = computed(() => this.authService.userFullName);

  readonly moderationBadge = computed(() => {
    this.staffInbox.moderationStats();
    return this.staffInbox.moderationNavBadge(this.isAdmin());
  });

  readonly complaintBadge = computed(() => {
    this.staffInbox.complaintStats();
    return this.staffInbox.complaintNavBadge(this.isAdmin());
  });

  readonly inboxTotalBadge = computed(() => this.moderationBadge() + this.complaintBadge());

  showReports = computed(() => this.isAdmin());
  reportsOpen = false;
  reportsActive = false;
  reportsMenuTop = 0;
  reportsMenuLeft = 0;
  inboxOpen = false;
  inboxMenuTop = 0;
  inboxMenuLeft = 0;

  @ViewChild('reportsTrigger') reportsTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('inboxTrigger') inboxTrigger?: ElementRef<HTMLButtonElement>;

  private readonly aboutItem: HeaderNavItem = {
    route: '/about',
    labelKey: 'nav.about',
    icon: 'about'
  };

  private readonly complaintsInboxItem: HeaderNavItem = {
    route: '/complaints/inbox',
    labelKey: 'nav.complaints',
    icon: 'complaints',
    badge: () => this.complaintBadge()
  };

  primaryNavItems = computed<HeaderNavItem[]>(() => {
    if (!this.isAuthenticated()) {
      return [
        { route: '/', labelKey: 'nav.home', icon: 'home', exact: true },
        { route: '/login', labelKey: 'nav.signIn', icon: 'signIn' },
        { route: '/register', labelKey: 'nav.register', icon: 'register' }
      ];
    }

    if (this.isAdmin()) {
      return [
        { route: '/dashboard', labelKey: 'nav.dashboard', icon: 'dashboard', exact: true },
        { route: '/text-analysis', labelKey: 'nav.textAnalysis', icon: 'analysis' },
        {
          route: '/moderation',
          labelKey: 'nav.moderation',
          icon: 'moderation',
          badge: () => this.moderationBadge()
        },
        { route: '/map', labelKey: 'nav.map', icon: 'map' },
        { route: '/authors', labelKey: 'nav.authors', icon: 'authors' },
        { route: '/team', labelKey: 'nav.team', icon: 'team' }
      ];
    }

    if (this.isStaff()) {
      return [
        {
          route: '/moderation',
          labelKey: 'nav.moderation',
          icon: 'moderation',
          badge: () => this.moderationBadge()
        },
        { route: '/map', labelKey: 'nav.map', icon: 'map' }
      ];
    }

    return [
      {
        route: '/complaints/new',
        labelKey: 'nav.submitComplaint',
        icon: 'complaintNew'
      }
    ];
  });

  trailingNavItems = computed<HeaderNavItem[]>(() => {
    const items: HeaderNavItem[] = [];

    if (this.isStaff()) {
      items.push(this.complaintsInboxItem);
    }

    items.push(this.aboutItem);
    return items;
  });

  homeLink = computed(() =>
    this.authService.isAuthenticated ? this.authService.defaultHomeRoute : '/'
  );

  ngOnInit(): void {
    this.staffInbox.refresh();
    this.syncReportsActive();
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.syncReportsActive();
        this.staffInbox.refresh();
      });
  }

  ngOnDestroy(): void {
    // Polling lives in StaffInboxService (auth subscription), not per header instance.
  }

  private syncReportsActive(): void {
    this.reportsActive = this.router.url.startsWith('/reports');
  }

  badgeCount(item: HeaderNavItem): number {
    this.moderationBadge();
    this.complaintBadge();
    return item.badge?.() ?? 0;
  }

  toggleReports(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.inboxOpen = false;
    this.reportsOpen = !this.reportsOpen;
    if (this.reportsOpen) {
      this.positionReportsMenu();
    }
  }

  toggleInbox(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.reportsOpen = false;
    this.inboxOpen = !this.inboxOpen;
    if (this.inboxOpen) {
      this.staffInbox.refresh();
      this.positionInboxMenu();
    }
  }

  positionReportsMenu(): void {
    const el = this.reportsTrigger?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    this.reportsMenuTop = Math.round(rect.bottom + 4);
    this.reportsMenuLeft = Math.round(rect.left);
  }

  positionInboxMenu(): void {
    const el = this.inboxTrigger?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    this.inboxMenuTop = Math.round(rect.bottom + 4);
    this.inboxMenuLeft = Math.round(rect.right - 240);
  }

  closeReports(): void {
    this.reportsOpen = false;
  }

  closeInbox(): void {
    this.inboxOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.reportsOpen = false;
    this.inboxOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.reportsOpen = false;
    this.inboxOpen = false;
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    this.staffInbox.refresh();
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onViewportChange(): void {
    if (this.reportsOpen) {
      this.positionReportsMenu();
    }
    if (this.inboxOpen) {
      this.positionInboxMenu();
    }
  }

  get userInitials(): string {
    const user = this.authService.currentUserValue;
    if (!user) return '';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  handleLogout(): void {
    this.staffInbox.stopPolling();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
