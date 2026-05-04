import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';

export interface ReportPieSlice {
  key: string;
  count: number;
  label: string;
}

const PIE_COLORS = [
  '#0d9488',
  '#6366f1',
  '#f59e0b',
  '#ec4899',
  '#22c55e',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#64748b',
  '#ef4444',
  '#06b6d4',
  '#a855f7'
];

@Component({
  selector: 'app-report-pie-chart',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './report-pie-chart.html',
  styleUrl: './report-pie-chart.css'
})
export class ReportPieChartComponent implements OnChanges {
  @Input({ required: true }) titleKey!: string;
  @Input() emptyKey = 'reports.pieEmpty';
  @Input() slices: ReportPieSlice[] = [];

  total = 0;
  pieBackground = 'transparent';
  legend: { label: string; count: number; color: string }[] = [];

  ngOnChanges(): void {
    this.rebuild();
  }

  private rebuild(): void {
    this.total = this.slices.reduce((s, x) => s + x.count, 0);
    this.legend = this.slices.map((x, i) => ({
      label: x.label,
      count: x.count,
      color: PIE_COLORS[i % PIE_COLORS.length]
    }));
    if (this.total <= 0 || this.slices.length === 0) {
      this.pieBackground = 'transparent';
      return;
    }
    if (this.slices.length === 1) {
      this.pieBackground = PIE_COLORS[0];
      return;
    }
    let acc = 0;
    const parts = this.slices.map((sl, i) => {
      const pct = (sl.count / this.total) * 100;
      const start = acc;
      acc += pct;
      return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}% ${acc}%`;
    });
    this.pieBackground = `conic-gradient(${parts.join(', ')})`;
  }
}
