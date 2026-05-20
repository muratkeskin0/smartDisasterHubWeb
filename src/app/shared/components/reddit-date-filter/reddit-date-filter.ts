import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  buildRedditPostRangeFromDatetimeLocals,
  rangeForPreset,
  ReportedRange,
  ReportedRangePreset,
  tryApplyCustomRedditPostDateRange
} from '../../../core/utils/reported-date-range';

@Component({
  selector: 'app-reddit-date-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoPipe],
  templateUrl: './reddit-date-filter.html',
  styleUrl: './reddit-date-filter.css'
})
export class RedditDateFilterComponent {
  @Input() datePreset: ReportedRangePreset = 'all';
  @Input() useCustomRange = false;
  @Input() customFromLocal = '';
  @Input() customToLocal = '';
  @Input() customRangeError: string | null = null;
  @Input() cssClass = '';

  @Output() rangeChange = new EventEmitter<ReportedRange>();
  @Output() datePresetChange = new EventEmitter<ReportedRangePreset>();
  @Output() useCustomRangeChange = new EventEmitter<boolean>();
  @Output() customFromLocalChange = new EventEmitter<string>();
  @Output() customToLocalChange = new EventEmitter<string>();
  @Output() customRangeErrorChange = new EventEmitter<string | null>();

  setDatePreset(preset: ReportedRangePreset): void {
    this.datePresetChange.emit(preset);
    this.useCustomRangeChange.emit(false);
    this.customFromLocalChange.emit('');
    this.customToLocalChange.emit('');
    this.customRangeErrorChange.emit(null);
    this.rangeChange.emit(rangeForPreset(preset));
  }

  applyCustomRange(): void {
    this.customRangeErrorChange.emit(null);
    const parsed = tryApplyCustomRedditPostDateRange(this.customFromLocal, this.customToLocal);
    if (!parsed.ok) {
      this.customRangeErrorChange.emit(parsed.i18nKey);
      return;
    }
    this.useCustomRangeChange.emit(true);
    this.rangeChange.emit(parsed.range);
  }

  clearCustomRange(): void {
    this.useCustomRangeChange.emit(false);
    this.datePresetChange.emit('all');
    this.customFromLocalChange.emit('');
    this.customToLocalChange.emit('');
    this.customRangeErrorChange.emit(null);
    this.rangeChange.emit(rangeForPreset('all'));
  }

  currentRange(): ReportedRange {
    if (this.useCustomRange) {
      return buildRedditPostRangeFromDatetimeLocals(this.customFromLocal, this.customToLocal);
    }
    return rangeForPreset(this.datePreset);
  }
}
