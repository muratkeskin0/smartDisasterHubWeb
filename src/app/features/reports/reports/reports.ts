import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { ReportsService } from '../../../core/services/reports.service';
import { HistoricalReportSummary, HistoricalTrendPoint, RedditPost, ReportBreakdown } from '../../../models';
import { PageResponse } from '../../../core/services/text-analysis.service';
import { ReportPieChartComponent, ReportPieSlice } from '../../../shared/components/report-pie-chart/report-pie-chart';
import { ReportBarLineChartComponent } from '../../../shared/components/report-bar-line-chart/report-bar-line-chart';
import { ReportedRange, ReportedRangePreset } from '../../../core/utils/reported-date-range';
import { RedditDateFilterComponent } from '../../../shared/components/reddit-date-filter/reddit-date-filter';
import { ListToolbarComponent } from '../../../shared/components/list-toolbar/list-toolbar';
import { PostStatusBadgesComponent } from '../../../shared/components/post-status-badges/post-status-badges';

type ReportView = 'all' | 'charts' | 'tables';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslocoPipe,
    AppHeaderComponent,
    BackButtonComponent,
    ReportPieChartComponent,
    ReportBarLineChartComponent,
    RedditDateFilterComponent,
    ListToolbarComponent,
    PostStatusBadgesComponent
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class ReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private transloco = inject(TranslocoService);
  private route = inject(ActivatedRoute);

  summary: HistoricalReportSummary | null = null;
  trend: HistoricalTrendPoint[] = [];
  topAdjusted: RedditPost[] = [];
  breakdown: ReportBreakdown | null = null;
  breakdownLoading = false;

  days = 14;
  activeRange: ReportedRange = { fromIso: null, toIso: null };
  datePreset: ReportedRangePreset = 'all';
  useCustomRange = false;
  customFromLocal = '';
  customToLocal = '';
  customRangeError: string | null = null;
  loading = true;
  topLoading = true;
  error = false;

  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 20;
  reportView: ReportView = 'all';

  ngOnInit(): void {
    const view = this.route.snapshot.data['reportView'] as ReportView | undefined;
    this.reportView = view ?? 'all';
    this.loadAll();
  }

  get showChartsSection(): boolean {
    return this.reportView === 'all' || this.reportView === 'charts';
  }

  get showTablesSection(): boolean {
    return this.reportView === 'all' || this.reportView === 'tables';
  }

  onRangeChange(range: ReportedRange): void {
    this.activeRange = range;
    this.currentPage = 0;
    this.loadAll();
  }

  onDatePresetChange(preset: ReportedRangePreset): void {
    this.datePreset = preset;
  }

  onTopPageSizeChange(): void {
    this.currentPage = 0;
    this.loadTopAdjusted();
  }

  loadAll(): void {
    this.loading = true;
    this.error = false;
    const range = this.activeRange;
    this.reportsService.getSummary(range).subscribe({
      next: (res) => {
        this.summary = res.success && res.data ? res.data : null;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });

    this.reportsService.getTrend(this.days, range).subscribe({
      next: (res) => {
        this.trend = res.success && res.data ? res.data : [];
      },
      error: () => {
        this.trend = [];
      }
    });

    this.loadBreakdown();
    this.loadTopAdjusted();
  }

  loadBreakdown(): void {
    this.breakdownLoading = true;
    const range = this.activeRange;
    this.reportsService.getBreakdown(range).subscribe({
      next: (res) => {
        this.breakdownLoading = false;
        this.breakdown = res.success && res.data ? res.data : null;
      },
      error: () => {
        this.breakdownLoading = false;
        this.breakdown = null;
      }
    });
  }

  disasterPieSlices(): ReportPieSlice[] {
    return (this.breakdown?.disasterTypes ?? []).map((x) => ({
      key: x.key,
      count: x.count,
      label: this.breakdownLabel('type', x.key)
    }));
  }

  dayPieSlices(): ReportPieSlice[] {
    const locale = this.transloco.getActiveLang() === 'tr' ? 'tr-TR' : 'en-US';
    const countsByDay = new Map<string, number>();
    let minDay: Date | null = null;
    let maxDay: Date | null = null;
    let otherDaysCount = 0;

    for (const x of this.breakdown?.postsByRedditDay ?? []) {
      if (x.key === 'other_days') {
        otherDaysCount += x.count;
        continue;
      }
      const d = new Date(x.key + 'T12:00:00');
      if (Number.isNaN(d.getTime())) {
        otherDaysCount += x.count;
        continue;
      }
      const key = this.toIsoDayKey(d);
      countsByDay.set(key, (countsByDay.get(key) ?? 0) + x.count);
      if (!minDay || d < minDay) minDay = d;
      if (!maxDay || d > maxDay) maxDay = d;
    }

    if (!minDay || !maxDay) {
      return otherDaysCount > 0
        ? [{
            key: 'other_days',
            count: otherDaysCount,
            label: this.transloco.translate('reports.breakdown.otherDays')
          }]
        : [];
    }

    const start = new Date(minDay.getFullYear(), minDay.getMonth(), minDay.getDate());
    const end = new Date(maxDay.getFullYear(), maxDay.getMonth(), maxDay.getDate());
    const out: ReportPieSlice[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = this.toIsoDayKey(d);
      const label = d.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
      out.push({ key, count: countsByDay.get(key) ?? 0, label });
    }

    if (otherDaysCount > 0) {
      out.push({
        key: 'other_days',
        count: otherDaysCount,
        label: this.transloco.translate('reports.breakdown.otherDays')
      });
    }

    return out;
  }

  dayChartLabels(): string[] {
    return this.dayPieSlices().map((s) => s.label);
  }

  dayChartBars(): number[] {
    return this.dayPieSlices().map((s) => s.count);
  }

  dayChartLine(): number[] {
    const bars = this.dayChartBars();
    const out: number[] = [];
    let acc = 0;
    for (const v of bars) {
      acc += v || 0;
      out.push(acc);
    }
    return out;
  }

  regionPieSlices(): ReportPieSlice[] {
    return (this.breakdown?.postsByRegion ?? []).map((x) => ({
      key: x.key,
      count: x.count,
      label: this.breakdownLabel('region', x.key)
    }));
  }

  private breakdownLabel(kind: 'type' | 'region', key: string): string {
    const path = `reports.breakdown.${kind}.${key}`;
    const t = this.transloco.translate(path);
    if (!t || t === path) {
      return key.replace(/_/g, ' ');
    }
    return t;
  }

  reloadTrend(): void {
    const range = this.activeRange;
    this.reportsService.getTrend(this.days, range).subscribe({
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
    const range = this.activeRange;
    this.reportsService.getTopAdjusted(this.currentPage, this.pageSize, range).subscribe({
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

  private toIsoDayKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

