/**
 * Text Analysis Service
 * Handles API calls for Reddit posts and analysis data
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../constants/api';
import { ApiResponse, RedditPost, PostStatistics, MapMarker } from '../../models';

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
    sortBy: string = 'analyzedAt',
    sortDirection: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<RedditPost>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
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
    sortBy: string = 'analyzedAt',
    sortDirection: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<RedditPost>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    return this.http.get<ApiResponse<PageResponse<RedditPost>>>(
      `${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.DISASTER_RELATED}`,
      { params }
    );
  }

  /**
   * Get post statistics
   */
  getStatistics(): Observable<ApiResponse<PostStatistics>> {
    return this.http.get<ApiResponse<PostStatistics>>(
      `${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.STATISTICS}`
    );
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
  getMapMarkers(): Observable<ApiResponse<MapMarker[]>> {
    return this.http.get<ApiResponse<MapMarker[]>>(
      `${this.apiUrl}${API_ENDPOINTS.REDDIT_POSTS.MAP}`
    );
  }
}




