import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../constants/api';
import { ApiResponse, RedditAuthor, RedditAuthorInsights } from '../../models';
import { PageResponse } from './text-analysis.service';

/**
 * Aggregated content authors (currently backed by /api/reddit-authors; may include other sources later).
 */
@Injectable({
  providedIn: 'root'
})
export class AuthorService {
  private apiUrl = 'http://localhost:8082';

  constructor(private http: HttpClient) {}

  getAuthors(
    page: number = 0,
    size: number = 20,
    search: string = '',
    sortBy: string = 'trustScore',
    sortDirection: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<RedditAuthor>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<ApiResponse<PageResponse<RedditAuthor>>>(
      `${this.apiUrl}${API_ENDPOINTS.AUTHORS.LIST}`,
      { params }
    );
  }

  getInsights(): Observable<ApiResponse<RedditAuthorInsights>> {
    return this.http.get<ApiResponse<RedditAuthorInsights>>(
      `${this.apiUrl}${API_ENDPOINTS.AUTHORS.INSIGHTS}`
    );
  }
}
