import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TextAnalysisService, PageResponse } from '../../../core/services/text-analysis.service';
import { PostModerationStatus, RedditPost, PostStatistics } from '../../../models';
import { ReportedRange, ReportedRangePreset } from '../../../core/utils/reported-date-range';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { RedditDateFilterComponent } from '../../../shared/components/reddit-date-filter/reddit-date-filter';
import { ListSortOption, ListToolbarComponent } from '../../../shared/components/list-toolbar/list-toolbar';
import { PostStatusBadgesComponent } from '../../../shared/components/post-status-badges/post-status-badges';
import { AppTipComponent } from '../../../shared/components/app-tip/app-tip';

export type ListFilterMode = 'all' | 'disaster' | 'pending' | 'approved' | 'rejected' | 'notRequired';

@Component({
  selector: 'app-text-analysis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AppHeaderComponent,
    BackButtonComponent,
    TranslocoPipe,
    RedditDateFilterComponent,
    ListToolbarComponent,
    PostStatusBadgesComponent,
    AppTipComponent
  ],
  templateUrl: './text-analysis.html',
  styleUrl: './text-analysis.css'
})
export class TextAnalysisComponent implements OnInit {
  private textAnalysisService = inject(TextAnalysisService);
  private transloco = inject(TranslocoService);

  posts: RedditPost[] = [];
  statistics: PostStatistics | null = null;
  loading = true;
  error: string | null = null;
  listFilter: ListFilterMode = 'all';
  activeRange: ReportedRange = { fromIso: null, toIso: null };

  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  sortBy = 'redditCreatedAt';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  datePreset: ReportedRangePreset = 'all';
  useCustomRange = false;
  customFromLocal = '';
  customToLocal = '';
  customRangeError: string | null = null;

  readonly sortOptions: ListSortOption[] = [
    { value: 'redditCreatedAt', labelKey: 'common.sortPostedDate' },
    { value: 'analyzedAt', labelKey: 'common.sortAnalyzedDate' },
    { value: 'relevanceScore', labelKey: 'common.sortRelevance' },
    { value: 'finalRelevanceScore', labelKey: 'common.sortFinalRelevance' },
    { value: 'upvotes', labelKey: 'common.sortUpvotes' }
  ];

  readonly filterChips: { id: ListFilterMode; labelKey: string }[] = [
    { id: 'all', labelKey: 'textAnalysis.filterAllPosts' },
    { id: 'disaster', labelKey: 'textAnalysis.filterDisaster' },
    { id: 'pending', labelKey: 'moderation.statusPending' },
    { id: 'approved', labelKey: 'moderation.statusApproved' },
    { id: 'rejected', labelKey: 'moderation.statusRejected' },
    { id: 'notRequired', labelKey: 'moderation.statusNotRequired' }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(refreshJobs: boolean = false): void {
    this.loading = true;
    this.error = null;

    if (refreshJobs) {
      this.textAnalysisService.triggerRefresh().subscribe({
        next: response => {
          if (response.success) {
            setTimeout(() => this.loadDataInternal(), 2000);
          } else {
            this.loadDataInternal();
          }
        },
        error: () => this.loadDataInternal()
      });
    } else {
      this.loadDataInternal();
    }
  }

  onRangeChange(range: ReportedRange): void {
    this.activeRange = range;
    this.currentPage = 0;
    this.loadDataInternal();
  }

  onDatePresetChange(preset: ReportedRangePreset): void {
    this.datePreset = preset;
  }

  setListFilter(mode: ListFilterMode): void {
    if (this.listFilter === mode) return;
    this.listFilter = mode;
    this.currentPage = 0;
    this.loadDataInternal();
  }

  onToolbarChange(): void {
    this.currentPage = 0;
    this.loadDataInternal();
  }

  private loadDataInternal(): void {
    const range = this.activeRange;
    this.textAnalysisService.getStatistics(range).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.statistics = response.data;
        }
      },
      error: err => console.error('Error loading statistics:', err)
    });

    let request$;
    if (this.listFilter === 'disaster') {
      request$ = this.textAnalysisService.getDisasterRelatedPosts(
        this.currentPage,
        this.pageSize,
        this.sortBy,
        this.sortDirection,
        range
      );
    } else {
      const modStatus = this.moderationParamForFilter();
      request$ = this.textAnalysisService.getAnalyzedPosts(
        this.currentPage,
        this.pageSize,
        this.sortBy,
        this.sortDirection,
        range,
        modStatus
      );
    }

    request$.subscribe({
      next: response => {
        if (response.success && response.data) {
          const pageData: PageResponse<RedditPost> = response.data;
          this.posts = pageData.content;
          this.totalPages = pageData.totalPages;
          this.totalElements = pageData.totalElements;
          this.currentPage = pageData.page;
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'textAnalysis.loadError';
        this.loading = false;
      }
    });
  }

  private moderationParamForFilter(): string | null {
    switch (this.listFilter) {
      case 'pending':
        return PostModerationStatus.PENDING_REVIEW;
      case 'approved':
        return PostModerationStatus.APPROVED;
      case 'rejected':
        return PostModerationStatus.REJECTED;
      case 'notRequired':
        return PostModerationStatus.NOT_REQUIRED;
      default:
        return null;
    }
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadDataInternal();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 7;
    if (this.totalPages <= maxPagesToShow) {
      for (let i = 0; i < this.totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      const startPage = Math.max(1, this.currentPage - 1);
      const endPage = Math.min(this.totalPages - 2, this.currentPage + 1);
      if (startPage > 1) pages.push(-1);
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      if (endPage < this.totalPages - 2) pages.push(-1);
      pages.push(this.totalPages - 1);
    }
    return pages;
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    const locale = this.transloco.getActiveLang() === 'tr' ? 'tr-TR' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRelevanceClass(score: number | null | undefined): string {
    if (score === null || score === undefined) return '';
    if (score >= 0.7) return 'relevance-high';
    if (score >= 0.4) return 'relevance-medium';
    return 'relevance-low';
  }

  formatPercent01(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return (value * 100).toFixed(1);
  }
}
