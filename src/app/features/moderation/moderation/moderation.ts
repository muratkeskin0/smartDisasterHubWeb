import { Component, effect, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TextAnalysisService, PageResponse } from '../../../core/services/text-analysis.service';
import { AdminStatsService } from '../../../core/services/admin-stats.service';
import { StaffInboxService } from '../../../core/services/staff-inbox.service';
import { AuthService } from '../../../core/services/auth.service';
import { ModerationQueueScope } from '../../../constants/roles';
import { ModerationStats, RedditPost } from '../../../models';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { RedditPostAnalysisPanelComponent } from '../../text-analysis/reddit-post-analysis-panel/reddit-post-analysis-panel';
import { ListSortOption, ListToolbarComponent } from '../../../shared/components/list-toolbar/list-toolbar';
import { PostStatusBadgesComponent } from '../../../shared/components/post-status-badges/post-status-badges';
import { AppTipComponent } from '../../../shared/components/app-tip/app-tip';

@Component({
  selector: 'app-moderation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AppHeaderComponent,
    BackButtonComponent,
    TranslocoPipe,
    RedditPostAnalysisPanelComponent,
    ListToolbarComponent,
    PostStatusBadgesComponent,
    AppTipComponent
  ],
  templateUrl: './moderation.html',
  styleUrl: './moderation.css'
})
export class ModerationComponent implements OnInit {
  private textAnalysisService = inject(TextAnalysisService);
  private adminStats = inject(AdminStatsService);
  private staffInbox = inject(StaffInboxService);
  private authService = inject(AuthService);
  private transloco = inject(TranslocoService);

  queueScope: ModerationQueueScope = 'UNASSIGNED';

  posts: RedditPost[] = [];
  selectedPost: RedditPost | null = null;
  selectedIndex = 0;
  rejectNotes = '';
  loading = true;
  acting = false;
  error: string | null = null;
  actionMessage: string | null = null;
  autoAdvance = true;

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  pendingTotal = 0;
  stats: ModerationStats | null = null;
  showWorkflowHint = false;

  private readonly workflowHintKey = 'sdh_moderation_workflow_hint_dismissed';

  constructor() {
    effect(() => {
      const stats = this.staffInbox.moderationStats();
      this.stats = stats;
      this.pendingTotal = stats?.allPendingCount ?? 0;
    });
  }

  sortBy = 'relevanceScore';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  readonly scopeChips: { id: ModerationQueueScope; labelKey: string; adminOnly?: boolean }[] = [
    { id: 'UNASSIGNED', labelKey: 'moderation.scopeUnassigned' },
    { id: 'MINE', labelKey: 'moderation.scopeMine' },
    { id: 'ALL', labelKey: 'moderation.scopeAll', adminOnly: true }
  ];

  readonly sortOptions: ListSortOption[] = [
    { value: 'relevanceScore', labelKey: 'common.sortRelevance' },
    { value: 'finalRelevanceScore', labelKey: 'common.sortFinalRelevance' },
    { value: 'analyzedAt', labelKey: 'common.sortAnalyzedDate' },
    { value: 'redditCreatedAt', labelKey: 'common.sortPostedDate' },
    { value: 'upvotes', labelKey: 'common.sortUpvotes' }
  ];

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get isManager(): boolean {
    return this.authService.isManager;
  }

  get backFallback(): string {
    return this.isAdmin ? '/dashboard' : '/moderation';
  }

  get assignedToOther(): boolean {
    if (!this.selectedPost || this.isAdmin) return false;
    const uid = this.authService.currentUserValue?.id;
    return (
      this.selectedPost.assignedModeratorId != null &&
      uid != null &&
      this.selectedPost.assignedModeratorId !== uid
    );
  }

  scopeCount(scope: ModerationQueueScope): number | null {
    if (!this.stats) return null;
    switch (scope) {
      case 'UNASSIGNED':
        return this.stats.unassignedCount;
      case 'MINE':
        return this.stats.mineCount;
      case 'ALL':
        return this.stats.allPendingCount;
      default:
        return null;
    }
  }

  visibleScopeChips() {
    return this.scopeChips.filter(c => !c.adminOnly || this.isAdmin);
  }

  ngOnInit(): void {
    this.queueScope = 'UNASSIGNED';
    if (this.isManager && !localStorage.getItem(this.workflowHintKey)) {
      this.showWorkflowHint = true;
    }
    this.refreshStats();
    this.loadQueue();
  }

  dismissWorkflowHint(): void {
    this.showWorkflowHint = false;
    localStorage.setItem(this.workflowHintKey, '1');
  }

  refreshStats(): void {
    this.staffInbox.refresh();
    this.adminStats.refresh().subscribe();
  }

  setQueueScope(scope: ModerationQueueScope): void {
    if (this.queueScope === scope) return;
    this.queueScope = scope;
    this.currentPage = 0;
    this.selectedPost = null;
    this.loadQueue();
  }

  loadQueue(): void {
    this.loading = true;
    this.error = null;
    this.textAnalysisService
      .getModerationPending(this.currentPage, this.pageSize, this.sortBy, this.sortDirection, this.queueScope)
      .subscribe({
        next: res => {
          if (res.success && res.data) {
            const page: PageResponse<RedditPost> = res.data;
            this.posts = page.content;
            this.totalPages = page.totalPages;
            this.totalElements = page.totalElements;
            this.currentPage = page.page;
            if (this.posts.length === 0) {
              this.selectedPost = null;
              this.selectedIndex = 0;
            } else if (this.selectedPost) {
              const idx = this.posts.findIndex(p => p.id === this.selectedPost!.id);
              if (idx >= 0) {
                this.selectedIndex = idx;
                this.selectedPost = this.posts[idx];
              } else {
                this.selectIndex(0);
              }
            } else {
              this.selectIndex(0);
            }
          } else {
            this.posts = [];
            this.selectedPost = null;
          }
          this.loading = false;
        },
        error: () => {
          this.error = 'moderation.loadError';
          this.loading = false;
        }
      });
  }

  onToolbarChange(): void {
    this.currentPage = 0;
    this.selectedPost = null;
    this.loadQueue();
  }

  selectPost(post: RedditPost): void {
    const idx = this.posts.findIndex(p => p.id === post.id);
    this.selectIndex(idx >= 0 ? idx : 0);
  }

  selectIndex(index: number): void {
    if (index < 0 || index >= this.posts.length) return;
    this.selectedIndex = index;
    this.selectedPost = this.posts[index];
    this.rejectNotes = '';
    this.actionMessage = null;
  }

  get canDecideSelected(): boolean {
    if (!this.selectedPost) return false;
    if (this.isAdmin) return true;
    const uid = this.authService.currentUserValue?.id;
    return uid != null && this.selectedPost.assignedModeratorId === uid;
  }

  get needsClaimSelected(): boolean {
    if (!this.selectedPost || this.isAdmin) return false;
    return this.selectedPost.assignedModeratorId == null;
  }

  get canReleaseSelected(): boolean {
    if (!this.selectedPost || this.isAdmin) return false;
    const uid = this.authService.currentUserValue?.id;
    return uid != null && this.selectedPost.assignedModeratorId === uid;
  }

  claimSelected(): void {
    if (!this.selectedPost || this.acting) return;
    this.acting = true;
    this.textAnalysisService.claimModerationPost(this.selectedPost.id).subscribe({
      next: res => {
        this.acting = false;
        if (res.success && res.data) {
          this.selectedPost = res.data;
          this.posts[this.selectedIndex] = res.data;
          this.actionMessage = 'moderation.claimSuccess';
          this.refreshStats();
        }
      },
      error: () => {
        this.acting = false;
        this.error = 'moderation.claimFailed';
      }
    });
  }

  releaseSelected(): void {
    if (!this.selectedPost || this.acting) return;
    this.acting = true;
    this.textAnalysisService.releaseModerationPost(this.selectedPost.id).subscribe({
      next: res => {
        this.acting = false;
        if (res.success && res.data) {
          this.actionMessage = 'moderation.releaseSuccess';
          this.refreshStats();
          this.loadQueue();
        }
      },
      error: () => {
        this.acting = false;
        this.error = 'moderation.releaseFailed';
      }
    });
  }

  approveSelected(): void {
    if (!this.selectedPost || this.acting || !this.canDecideSelected) return;
    this.runAction(() => this.textAnalysisService.approvePost(this.selectedPost!.id));
  }

  rejectSelected(): void {
    if (!this.selectedPost || this.acting || !this.canDecideSelected) return;
    const msg = this.transloco.translate('moderation.confirmReject');
    if (!confirm(msg)) return;
    const notes = this.rejectNotes.trim() || null;
    this.runAction(() => this.textAnalysisService.rejectPost(this.selectedPost!.id, notes));
  }

  private runAction(call: () => import('rxjs').Observable<{ success: boolean; data?: RedditPost }>): void {
    this.acting = true;
    this.actionMessage = null;
    call().subscribe({
      next: res => {
        this.acting = false;
        if (res.success) {
          this.actionMessage = 'moderation.actionSuccess';
          this.refreshStats();
          if (this.posts.length <= 1 && this.currentPage > 0) {
            this.currentPage--;
          }
          const prevIndex = this.selectedIndex;
          this.loadQueueAfterAction(prevIndex);
        } else {
          this.error = 'moderation.actionFailed';
        }
      },
      error: () => {
        this.acting = false;
        this.error = 'moderation.actionFailed';
      }
    });
  }

  private loadQueueAfterAction(prevIndex: number): void {
    this.textAnalysisService
      .getModerationPending(this.currentPage, this.pageSize, this.sortBy, this.sortDirection, this.queueScope)
      .subscribe({
        next: res => {
          if (res.success && res.data) {
            const page: PageResponse<RedditPost> = res.data;
            this.posts = page.content;
            this.totalPages = page.totalPages;
            this.totalElements = page.totalElements;
            this.currentPage = page.page;
            if (this.posts.length === 0) {
              this.selectedPost = null;
              return;
            }
            const nextIdx = this.autoAdvance
              ? Math.min(prevIndex, this.posts.length - 1)
              : Math.min(prevIndex, Math.max(0, this.posts.length - 1));
            this.selectIndex(nextIdx);
          }
        }
      });
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.selectedPost = null;
      this.loadQueue();
    }
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    const locale = this.transloco.getActiveLang() === 'tr' ? 'tr-TR' : 'en-US';
    return new Date(dateString).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPercent01(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return (value * 100).toFixed(1);
  }

  getRelevanceClass(score: number | null | undefined): string {
    if (score === null || score === undefined) return '';
    if (score >= 0.7) return 'relevance-high';
    if (score >= 0.4) return 'relevance-medium';
    return 'relevance-low';
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    const t = event.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) {
      return;
    }
    if (this.loading || this.acting || this.posts.length === 0) return;
    switch (event.key) {
      case 'j':
      case 'ArrowDown':
        event.preventDefault();
        this.selectIndex(Math.min(this.selectedIndex + 1, this.posts.length - 1));
        break;
      case 'k':
      case 'ArrowUp':
        event.preventDefault();
        this.selectIndex(Math.max(this.selectedIndex - 1, 0));
        break;
      case 'a':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.approveSelected();
        }
        break;
      case 'r':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.rejectSelected();
        }
        break;
    }
  }
}
