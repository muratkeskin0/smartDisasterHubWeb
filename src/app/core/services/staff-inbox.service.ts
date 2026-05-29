import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { Subscription, tap } from 'rxjs';
import { TextAnalysisService } from './text-analysis.service';
import { ComplaintService } from './complaint.service';
import { AuthService } from './auth.service';
import { ComplaintInboxScope } from '../../constants/roles';
import { ComplaintStats, ModerationStats } from '../../models';

const POLL_INTERVAL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class StaffInboxService implements OnDestroy {
  private textAnalysisService = inject(TextAnalysisService);
  private complaintService = inject(ComplaintService);
  private authService = inject(AuthService);

  readonly moderationStats = signal<ModerationStats | null>(null);
  readonly complaintStats = signal<ComplaintStats | null>(null);

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private authSub: Subscription | null = null;
  private statsSub: Subscription | null = null;
  private moderationRefreshInFlight = false;
  private moderationRefreshQueued = false;
  private complaintRefreshInFlight = false;
  private complaintRefreshQueued = false;

  constructor() {
    this.statsSub = this.complaintService.stats$.subscribe(stats => {
      if (stats) {
        this.complaintStats.set(stats);
      }
    });

    this.authSub = this.authService.currentUser$.subscribe(user => {
      if (user && this.authService.isStaff) {
        this.startPolling();
      } else {
        this.stopPolling();
        this.moderationStats.set(null);
        this.complaintStats.set(null);
      }
    });
  }

  ngOnDestroy(): void {
    this.statsSub?.unsubscribe();
    this.authSub?.unsubscribe();
    this.stopPolling();
  }

  /** Pending moderation items relevant to the current staff role. */
  moderationNavBadge(isAdmin: boolean): number {
    const stats = this.moderationStats();
    if (!stats) return 0;
    if (isAdmin) {
      return stats.allPendingCount;
    }
    return stats.unassignedCount + stats.mineCount;
  }

  /** Active complaints that need staff attention (matches inbox open scopes). */
  complaintNavBadge(isAdmin: boolean): number {
    const stats = this.complaintStats();
    if (!stats) return 0;
    if (isAdmin) {
      return stats.allOpenCount;
    }
    return stats.unassignedCount + stats.mineCount;
  }

  /** Scope chip counts aligned with complaint inbox tabs. */
  complaintScopeCount(scope: ComplaintInboxScope, stats: ComplaintStats | null): number | null {
    if (!stats) return null;
    switch (scope) {
      case 'UNASSIGNED':
        return stats.unassignedCount;
      case 'MINE':
        return stats.mineCount;
      case 'ALL':
        return stats.allOpenCount;
      case 'RESOLVED':
        return stats.resolvedCount;
      default:
        return null;
    }
  }

  inboxTotal(isAdmin: boolean): number {
    return this.moderationNavBadge(isAdmin) + this.complaintNavBadge(isAdmin);
  }

  refresh(): void {
    this.refreshModeration();
    this.refreshComplaints();
  }

  refreshModeration(): void {
    if (!this.authService.isStaff) return;
    if (this.moderationRefreshInFlight) {
      this.moderationRefreshQueued = true;
      return;
    }

    this.moderationRefreshInFlight = true;
    this.textAnalysisService.getModerationStats().pipe(
      tap(res => {
        if (res.success && res.data) {
          this.moderationStats.set(res.data);
        }
      })
    ).subscribe({
      complete: () => this.finishModerationRefresh(),
      error: () => this.finishModerationRefresh()
    });
  }

  refreshComplaints(): void {
    if (!this.authService.isStaff) return;
    if (this.complaintRefreshInFlight) {
      this.complaintRefreshQueued = true;
      return;
    }

    this.complaintRefreshInFlight = true;
    this.complaintService.refreshStats().subscribe({
      complete: () => this.finishComplaintRefresh(),
      error: () => this.finishComplaintRefresh()
    });
  }

  private finishModerationRefresh(): void {
    this.moderationRefreshInFlight = false;
    if (this.moderationRefreshQueued) {
      this.moderationRefreshQueued = false;
      this.refreshModeration();
    }
  }

  private finishComplaintRefresh(): void {
    this.complaintRefreshInFlight = false;
    if (this.complaintRefreshQueued) {
      this.complaintRefreshQueued = false;
      this.refreshComplaints();
    }
  }

  startPolling(): void {
    if (this.pollTimer) return;
    if (!this.authService.isStaff) return;
    this.refresh();
    this.pollTimer = setInterval(() => this.refresh(), POLL_INTERVAL_MS);
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  applyModerationStats(stats: ModerationStats): void {
    this.moderationStats.set(stats);
  }

  applyComplaintStats(stats: ComplaintStats): void {
    this.complaintStats.set(stats);
  }
}
