import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-report-bar-line-chart',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './report-bar-line-chart.html',
  styleUrl: './report-bar-line-chart.css'
})
export class ReportBarLineChartComponent implements OnChanges {
  @Input({ required: true }) titleKey!: string;
  @Input() emptyKey = 'reports.pieEmpty';

  /** Category labels (x-axis). */
  @Input() labels: string[] = [];
  /** Bar series, same length as labels. */
  @Input() bars: number[] = [];
  maxBar = 0;
  axisLeft: number[] = [];
  labelStep = 1;

  ngOnChanges(): void {
    this.rebuild();
  }

  get isEmpty(): boolean {
    return !this.labels?.length || !this.bars?.length || this.totalBars() <= 0;
  }

  barPct(v: number): number {
    if (!this.maxBar) return 0;
    return Math.max(0, Math.min(100, (v / this.maxBar) * 100));
  }

  private rebuild(): void {
    const safeBars = (this.bars ?? []).map((x) => (Number.isFinite(x) ? x : 0));
    this.maxBar = Math.max(0, ...safeBars);

    this.axisLeft = this.buildAxisTicks(this.maxBar);
    this.labelStep = this.computeLabelStep(this.labels?.length ?? 0);
  }

  showLabel(i: number): boolean {
    if (!this.labels?.length) return false;
    if (this.labelStep <= 1) return true;
    // Always show first/last plus periodic labels.
    return i === 0 || i === this.labels.length - 1 || i % this.labelStep === 0;
  }

  private buildAxisTicks(max: number): number[] {
    if (!max || max <= 0) return [0];
    if (max <= 4) {
      // Avoid duplicate ticks for tiny ranges (e.g. 0,1,2,2,3).
      return Array.from({ length: max + 1 }, (_, i) => i);
    }
    const steps = 4;
    const ticks = new Set<number>();
    for (let i = 0; i <= steps; i++) {
      ticks.add(Math.round((max * i) / steps));
    }
    ticks.add(max);
    return Array.from(ticks).sort((a, b) => a - b);
  }

  private computeLabelStep(n: number): number {
    if (n <= 10) return 1;
    if (n <= 20) return 2;
    if (n <= 40) return 4;
    if (n <= 70) return 7;
    return 10;
  }

  get axisLeftDisplay(): number[] {
    return [...this.axisLeft].reverse();
  }

  private totalBars(): number {
    return (this.bars ?? []).reduce((s, x) => s + (Number.isFinite(x) ? x : 0), 0);
  }
}

