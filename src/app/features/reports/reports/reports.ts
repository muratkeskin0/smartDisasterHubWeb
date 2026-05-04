import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { ReportsService } from '../../../core/services/reports.service';
import { HistoricalReportSummary, HistoricalTrendPoint, RedditPost } from '../../../models';
import { PageResponse } from '../../../core/services/text-analysis.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslocoPipe, AppHeaderComponent, BackButtonComponent],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class ReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private transloco = inject(TranslocoService);

  summary: HistoricalReportSummary | null = null;
  trend: HistoricalTrendPoint[] = [];
  topAdjusted: RedditPost[] = [];

  days = 14;
  loading = true;
  topLoading = true;
  error = false;

  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 20;

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.error = false;
    this.reportsService.getSummary().subscribe({
      next: (res) => {
        this.summary = res.success && res.data ? res.data : null;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });

    this.reportsService.getTrend(this.days).subscribe({
      next: (res) => {
        this.trend = res.success && res.data ? res.data : [];
      },
      error: () => {
        this.trend = [];
      }
    });

    this.loadTopAdjusted();
  }

  reloadTrend(): void {
    this.reportsService.getTrend(this.days).subscribe({
      next: (res) => {
        this.trend = res.success && res.data ? res.data : [];
      },
      error: () => {
        this.trend = [];
      }
    });
  }

  loadTopAdjusted(): void {
    this.topLoading = true;
    this.reportsService.getTopAdjusted(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.topLoading = false;
        if (res.success && res.data) {
          const p: PageResponse<RedditPost> = res.data;
          this.topAdjusted = p.content;
          this.currentPage = p.page;
          this.totalPages = p.totalPages;
          this.totalElements = p.totalElements;
        } else {
          this.topAdjusted = [];
        }
      },
      error: () => {
        this.topLoading = false;
        this.topAdjusted = [];
      }
    });
  }

  goPage(page: number): void {
    if (page < 0 || page >= this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.loadTopAdjusted();
  }

  pct(v?: number | null): string {
    if (v == null || Number.isNaN(v)) {
      return '—';
    }
    return (v * 100).toFixed(2) + '%';
  }

  signedPct(v?: number | null): string {
    if (v == null || Number.isNaN(v)) {
      return '—';
    }
    const p = (v * 100).toFixed(2) + '%';
    return v > 0 ? '+' + p : p;
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return '—';
    }
    const locale = this.transloco.getActiveLang() === 'tr' ? 'tr-TR' : 'en-US';
    return new Date(value).toLocaleString(locale);
  }
}

