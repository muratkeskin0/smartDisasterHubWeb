import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TextAnalysisService, PageResponse } from '../../../core/services/text-analysis.service';
import { RedditPost, PostStatistics, RedditPostStatus } from '../../../models';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

/**
 * List of analyzed posts: one trust/relevance score per row; full breakdown on detail route.
 */
@Component({
  selector: 'app-text-analysis',
  standalone: true,
  imports: [CommonModule, RouterModule, AppHeaderComponent, BackButtonComponent, TranslocoPipe],
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
  filterDisasterOnly = false;

  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  sortBy = 'redditCreatedAt';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(refreshJobs: boolean = false): void {
    this.loading = true;
    this.error = null;

    if (refreshJobs) {
      this.textAnalysisService.triggerRefresh().subscribe({
        next: (response) => {
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

  private loadDataInternal(): void {
    this.textAnalysisService.getStatistics().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.statistics = response.data;
        }
      },
      error: (err) => console.error('Error loading statistics:', err)
    });

    const postsObservable = this.filterDisasterOnly
      ? this.textAnalysisService.getDisasterRelatedPosts(this.currentPage, this.pageSize, this.sortBy, this.sortDirection)
      : this.textAnalysisService.getAnalyzedPosts(this.currentPage, this.pageSize, this.sortBy, this.sortDirection);

    postsObservable.subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const pageData: PageResponse<RedditPost> = response.data;
          this.posts = pageData.content;
          this.totalPages = pageData.totalPages;
          this.totalElements = pageData.totalElements;
          this.currentPage = pageData.page;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading posts:', err);
        this.error = 'Failed to load posts. Please try again later.';
        this.loading = false;
      }
    });
  }

  toggleFilter(): void {
    this.filterDisasterOnly = !this.filterDisasterOnly;
    this.currentPage = 0;
    this.loadData();
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadData();
    }
  }

  changeSort(field: string): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortDirection = 'DESC';
    }
    this.currentPage = 0;
    this.loadData();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 7;

    if (this.totalPages <= maxPagesToShow) {
      for (let i = 0; i < this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(0);
      const startPage = Math.max(1, this.currentPage - 1);
      const endPage = Math.min(this.totalPages - 2, this.currentPage + 1);
      if (startPage > 1) {
        pages.push(-1);
      }
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      if (endPage < this.totalPages - 2) {
        pages.push(-1);
      }
      pages.push(this.totalPages - 1);
    }
    return pages;
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const locale = this.transloco.getActiveLang() === 'tr' ? 'tr-TR' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: RedditPostStatus): string {
    switch (status) {
      case RedditPostStatus.ANALYZED:
        return 'status-analyzed';
      case RedditPostStatus.PENDING:
        return 'status-pending';
      case RedditPostStatus.FAILED:
        return 'status-failed';
      default:
        return '';
    }
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
