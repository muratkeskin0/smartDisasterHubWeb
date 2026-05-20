/**
 * Text Analysis Service
 * Handles API calls for Reddit posts and analysis data
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../constants/api';
import { ApiResponse, RedditPost, PostStatistics, MapMarker, ModerationStats } from '../../models';
import { appendReportedRangeParams, hasReportedRange, ReportedRange } from '../utils/reported-date-range';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PageRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

@Injectable({
  providedIn: 'root'
})
export class TextAnalysisService {
  private apiUrl = 'http://localhost:8082';

  constructor(private http: HttpClient) {}

  /**
   * Get analyzed posts with pagination and sorting
   */
  getAnalyzedPosts(
    page: number = 0,
    size: number = 50,
    sortBy: string = 'redditCreatedAt',
    sortDirection: 'ASC' | 'DESC' = 'DESC',
    range?: ReportedRange | null,
    moderationStatus?: string | null
  ): Observable<ApiResponse<PageResponse<RedditPost>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (moderationStatus) {
      params = params.set('moderationStatus', moderationStatus);
    }
    if (range && hasReportedRange(range)) {
      params = appendReportedRangeParams(params, range);
    }
    return this.http.get<ApiResponse<PageResponse<RedditPost>>>(
      `${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.ANALYZED}`,
      { params }
    );
  }

  /**
   * Get disaster-related posts only with pagination and sorting
   */
  getDisasterRelatedPosts(
    page: number = 0,
    size: number = 50,
    sortBy: string = 'redditCreatedAt',
    sortDirection: 'ASC' | 'DESC' = 'DESC',
    range?: ReportedRange | null
  ): Observable<ApiResponse<PageResponse<RedditPost>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (range && hasReportedRange(range)) {
      params = appendReportedRangeParams(params, range);
    }
    return this.http.get<ApiResponse<PageResponse<RedditPost>>>(
      `${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.DISASTER_RELATED}`,
      { params }
    );
  }

  /**
   * Get post statistics
   */
  getStatistics(range?: ReportedRange | null): Observable<ApiResponse<PostStatistics>> {
    const params =
      range && hasReportedRange(range) ? appendReportedRangeParams(new HttpParams(), range) : undefined;
    return this.http.get<ApiResponse<PostStatistics>>(`${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.STATISTICS}`, {
      ...(params ? { params } : {})
    });
  }

  /**
   * Get post by Reddit post ID
   */
  getPostByRedditId(redditPostId: string): Observable<ApiResponse<RedditPost>> {
    return this.http.get<ApiResponse<RedditPost>>(
      `${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.BY_ID}/${redditPostId}`
    );
  }

  /**
   * Get map markers - disaster-related posts grouped by location
   */
  getMapMarkers(range?: ReportedRange | null): Observable<ApiResponse<MapMarker[]>> {
    const params =
      range && hasReportedRange(range) ? appendReportedRangeParams(new HttpParams(), range) : undefined;
    return this.http.get<ApiResponse<MapMarker[]>>(`${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.MAP}`, {
      ...(params ? { params } : {})
    });
  }

  /**
   * Manually trigger refresh (fetch + analyze jobs)
   * Fetches new posts from Reddit and analyzes pending posts
   */
  triggerRefresh(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.REFRESH}`,
      {}
    );
  }

  /**
   * Manually trigger fetch job only
   */
  triggerFetchJob(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.FETCH_JOB}`,
      {}
    );
  }

  /**
   * Manually trigger analysis job only
   */
  triggerAnalysisJob(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.ANALYZE_JOB}`,
      {}
    );
  }

  getModerationStats(): Observable<ApiResponse<ModerationStats>> {
    return this.http.get<ApiResponse<ModerationStats>>(
      `${this.apiUrl}${API_ENDPOINTS.MODERATION.STATS}`
    );
  }

  getModerationPending(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'relevanceScore',
    sortDirection: 'ASC' | 'DESC' = 'DESC',
    scope?: 'MINE' | 'UNASSIGNED' | 'ALL'
  ): Observable<ApiResponse<PageResponse<RedditPost>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (scope) {
      params = params.set('scope', scope);
    }
    return this.http.get<ApiResponse<PageResponse<RedditPost>>>(
      `${this.apiUrl}${API_ENDPOINTS.MODERATION.PENDING}`,
      { params }
    );
  }

  claimModerationPost(postId: number): Observable<ApiResponse<RedditPost>> {
    return this.http.post<ApiResponse<RedditPost>>(
      `${this.apiUrl}${API_ENDPOINTS.MODERATION.CLAIM}/${postId}/claim`,
      {}
    );
  }

  releaseModerationPost(postId: number): Observable<ApiResponse<RedditPost>> {
    return this.http.post<ApiResponse<RedditPost>>(
      `${this.apiUrl}${API_ENDPOINTS.MODERATION.RELEASE}/${postId}/release`,
      {}
    );
  }

  approvePost(postId: number): Observable<ApiResponse<RedditPost>> {
    return this.http.post<ApiResponse<RedditPost>>(
      `${this.apiUrl}${API_ENDPOINTS.MODERATION.APPROVE}/${postId}/approve`,
      {}
    );
  }

  rejectPost(postId: number, notes?: string | null): Observable<ApiResponse<RedditPost>> {
    return this.http.post<ApiResponse<RedditPost>>(
      `${this.apiUrl}${API_ENDPOINTS.MODERATION.APPROVE}/${postId}/reject`,
      notes ? { notes } : {}
    );
  }
}






