import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { TextAnalysisService } from './text-analysis.service';
import { ApiResponse, PostStatistics } from '../../models';

@Injectable({ providedIn: 'root' })
export class AdminStatsService {
  private textAnalysisService = inject(TextAnalysisService);
  private statsSubject = new BehaviorSubject<PostStatistics | null>(null);
  private loading = false;

  readonly stats$ = this.statsSubject.asObservable();

  get snapshot(): PostStatistics | null {
    return this.statsSubject.value;
  }

  refresh(): Observable<ApiResponse<PostStatistics>> {
    if (this.loading) {
      return new Observable(sub => {
        const v = this.statsSubject.value;
        if (v) {
          sub.next({ success: true, message: '', data: v, timestamp: new Date().toISOString() });
        }
        sub.complete();
      });
    }
    this.loading = true;
    return this.textAnalysisService.getStatistics().pipe(
      tap({
        next: res => {
          if (res.success && res.data) {
            this.statsSubject.next(res.data);
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      })
    );
  }
}
