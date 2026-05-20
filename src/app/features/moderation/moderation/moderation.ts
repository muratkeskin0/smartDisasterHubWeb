import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TextAnalysisService, PageResponse } from '../../../core/services/text-analysis.service';
import { AdminStatsService } from '../../../core/services/admin-stats.service';
import { RedditPost } from '../../../models';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { RedditPostAnalysisPanelComponent } from '../../text-analysis/reddit-post-analysis-panel/reddit-post-analysis-panel';
import { ListSortOption, ListToolbarComponent } from '../../../shared/components/list-toolbar/list-toolbar';
import { PostStatusBadgesComponent } from '../../../shared/components/post-status-badges/post-status-badges';

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
    PostStatusBadgesComponent
  ],
  templateUrl: './moderation.html',
  styleUrl: './moderation.css'
})
export class ModerationComponent implements OnInit {
  private textAnalysisService = inject(TextAnalysisService);
  private adminStats = inject(AdminStatsService);
  private transloco = inject(TranslocoService);

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

  sortBy = 'relevanceScore';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  readonly sortOptions: ListSortOption[] = [
    { value: 'relevanceScore', labelKey: 'common.sortRelevance' },
    { value: 'finalRelevanceScore', labelKey: 'common.sortFinalRelevance' },
    { value: 'analyzedAt', labelKey: 'common.sortAnalyzedDate' },
    { value: 'redditCreatedAt', labelKey: 'common.sortPostedDate' },
    { value: 'upvotes', labelKey: 'common.sortUpvotes' }
  ];

  ngOnInit(): void {
    this.adminStats.refresh().subscribe();
    this.loadQueue();
  }

  loadQueue(): void {
    this.loading = true;
    this.error = null;
    this.textAnalysisService
      .getModerationPending(this.currentPage, this.pageSize, this.sortBy, this.sortDirection)
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

  approveSelected(): void {
    if (!this.selectedPost || this.acting) return;
    this.runAction(() => this.textAnalysisService.approvePost(this.selectedPost!.id));
  }

  rejectSelected(): void {
    if (!this.selectedPost || this.acting) return;
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
          this.adminStats.refresh().subscribe();
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
      .getModerationPending(this.currentPage, this.pageSize, this.sortBy, this.sortDirection)
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
