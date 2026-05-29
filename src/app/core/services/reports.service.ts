import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import { ApiResponse, HistoricalReportSummary, HistoricalTrendPoint, RedditPost, ReportBreakdown } from '../../models';
import { PageResponse } from './text-analysis.service';
import { appendReportedRangeParams, hasReportedRange, ReportedRange } from '../utils/reported-date-range';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = API_BASE_URL;

  constructor(private http: HttpClient) {}

  getSummary(range?: ReportedRange | null): Observable<ApiResponse<HistoricalReportSummary>> {
    const params =
      range && hasReportedRange(range) ? appendReportedRangeParams(new HttpParams(), range) : undefined;
    return this.http.get<ApiResponse<HistoricalReportSummary>>(
      `${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.REPORTS_SUMMARY}`,
      { ...(params ? { params } : {}) }
    );
  }

  getTrend(days: number = 14, range?: ReportedRange | null): Observable<ApiResponse<HistoricalTrendPoint[]>> {
    let params = new HttpParams();
    if (range && hasReportedRange(range)) {
      params = appendReportedRangeParams(params, range);
    } else {
      params = params.set('days', String(days));
    }
    return this.http.get<ApiResponse<HistoricalTrendPoint[]>>(
      `${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.REPORTS_TREND}`,
      { params }
    );
  }

  getTopAdjusted(
    page: number = 0,
    size: number = 20,
    range?: ReportedRange | null
  ): Observable<ApiResponse<PageResponse<RedditPost>>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (range && hasReportedRange(range)) {
      params = appendReportedRangeParams(params, range);
    }
    return this.http.get<ApiResponse<PageResponse<RedditPost>>>(
      `${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.REPORTS_TOP_ADJUSTED}`,
      { params }
    );
  }

  getBreakdown(range?: ReportedRange | null): Observable<ApiResponse<ReportBreakdown>> {
    const params =
      range && hasReportedRange(range) ? appendReportedRangeParams(new HttpParams(), range) : undefined;
    return this.http.get<ApiResponse<ReportBreakdown>>(
      `${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.REPORTS_BREAKDOWN}`,
      { ...(params ? { params } : {}) }
    );
  }
}

