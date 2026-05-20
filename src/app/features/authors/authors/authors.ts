import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { AuthorService } from '../../../core/services/author.service';
import { RedditAuthor, RedditAuthorInsights } from '../../../models';
import { PageResponse } from '../../../core/services/text-analysis.service';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ListSortOption, ListToolbarComponent } from '../../../shared/components/list-toolbar/list-toolbar';

@Component({
  selector: 'app-authors',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AppHeaderComponent,
    BackButtonComponent,
    TranslocoPipe,
    ListToolbarComponent
  ],
  templateUrl: './authors.html',
  styleUrl: './authors.css'
})
export class AuthorsComponent implements OnInit {
  private authorService = inject(AuthorService);
  private transloco = inject(TranslocoService);

  authors: RedditAuthor[] = [];
  insights: RedditAuthorInsights | null = null;
  loading = true;
  insightsLoading = true;
  loadError = false;

  search = '';
  searchDraft = '';
  sortBy: 'trustScore' | 'totalPosts' | 'analyzedPosts' | 'disasterRelatedPosts' | 'redditUsername' | 'lastPostAt' =
    'trustScore';
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  pageSize = 15;
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;

  readonly sortOptions: ListSortOption[] = [
    { value: 'trustScore', labelKey: 'authors.trustScore' },
    { value: 'totalPosts', labelKey: 'authors.totalPosts' },
    { value: 'analyzedPosts', labelKey: 'authors.analyzedPosts' },
    { value: 'disasterRelatedPosts', labelKey: 'authors.disasterRelated' },
    { value: 'redditUsername', labelKey: 'authors.username' },
    { value: 'lastPostAt', labelKey: 'authors.lastPost' }
  ];

  ngOnInit(): void {
    this.loadInsights();
    this.loadAuthors();
  }

  loadInsights(): void {
    this.insightsLoading = true;
    this.authorService.getInsights().subscribe({
      next: res => {
        this.insightsLoading = false;
        if (res.success && res.data) {
          this.insights = res.data;
        }
      },
      error: () => {
        this.insightsLoading = false;
      }
    });
  }

  loadAuthors(): void {
    this.loading = true;
    this.loadError = false;
    this.authorService.getAuthors(this.currentPage, this.pageSize, this.search, this.sortBy, this.sortDirection).subscribe({
      next: res => {
        this.loading = false;
        if (res.success && res.data) {
          const p: PageResponse<RedditAuthor> = res.data;
          this.authors = p.content;
          this.currentPage = p.page;
          this.totalPages = p.totalPages;
          this.totalElements = p.totalElements;
        } else {
          this.authors = [];
        }
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
        this.authors = [];
      }
    });
  }

  applySearch(): void {
    this.search = this.searchDraft;
    this.currentPage = 0;
    this.loadAuthors();
  }

  clearSearch(): void {
    this.searchDraft = '';
    this.search = '';
    this.currentPage = 0;
    this.loadAuthors();
  }

  onSortChange(): void {
    this.currentPage = 0;
    this.loadAuthors();
  }

  goPage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.currentPage = p;
    this.loadAuthors();
  }

  trustPercent(t?: number | null): string {
    if (t == null || Number.isNaN(t)) return '—';
    return (t * 100).toFixed(1) + '%';
  }

  barWidthTrust(t?: number | null): number {
    if (t == null || Number.isNaN(t)) return 0;
    return Math.min(100, Math.max(0, t * 100));
  }

  maxPostsForChart(): number {
    if (!this.insights?.topByPostVolume?.length) return 1;
    return Math.max(1, ...this.insights.topByPostVolume.map(a => a.totalPosts));
  }

  postBarWidth(n: number): number {
    return Math.min(100, (n / this.maxPostsForChart()) * 100);
  }

  disasterRatio(a: RedditAuthor): string {
    if (!a.analyzedPosts) return '—';
    return ((a.disasterRelatedPosts / a.analyzedPosts) * 100).toFixed(0) + '%';
  }

  formatDate(s?: string | null): string {
    if (!s) return '—';
    const locale = this.transloco.getActiveLang() === 'tr' ? 'tr-TR' : 'en-US';
    return new Date(s).toLocaleString(locale);
  }
}
