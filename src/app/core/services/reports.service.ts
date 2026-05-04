import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../constants/api';
import { ApiResponse, HistoricalReportSummary, HistoricalTrendPoint, RedditPost } from '../../models';
import { PageResponse } from './text-analysis.service';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = 'http://localhost:8082';

  constructor(private http: HttpClient) {}

  getSummary(): Observable<ApiResponse<HistoricalReportSummary>> {
    return this.http.get<ApiResponse<HistoricalReportSummary>>(
      `${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.REPORTS_SUMMARY}`
    );
  }

  getTrend(days: number = 14): Observable<ApiResponse<HistoricalTrendPoint[]>> {
    const params = new HttpParams().set('days', String(days));
    return this.http.get<ApiResponse<HistoricalTrendPoint[]>>(
      `${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.REPORTS_TREND}`,
      { params }
    );
  }

  getTopAdjusted(page: number = 0, size: number = 20): Observable<ApiResponse<PageResponse<RedditPost>>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<ApiResponse<PageResponse<RedditPost>>>(
      `${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.REPORTS_TOP_ADJUSTED}`,
      { params }
    );
  }
}

