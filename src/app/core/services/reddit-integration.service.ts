import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import { ApiResponse } from '../../models';

export interface RedditIntegrationSettings {
  clientId: string | null;
  clientSecretConfigured: boolean;
  username: string | null;
  passwordConfigured: boolean;
  userAgent: string | null;
  subreddits: string | null;
  enabled: boolean;
  configured: boolean;
  configSource: string;
  lastTestAt: string | null;
  lastTestSuccess: boolean | null;
  lastTestMessage: string | null;
  lastFetchAt: string | null;
  lastFetchCount: number | null;
}

export interface RedditIntegrationStatus {
  configured: boolean;
  enabled: boolean;
  configSource: string;
  lastTestAt: string | null;
  lastTestSuccess: boolean | null;
  lastTestMessage: string | null;
}

export interface RedditIntegrationUpdate {
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  userAgent?: string;
  subreddits?: string;
  enabled?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RedditIntegrationService {
  private http = inject(HttpClient);
  private apiUrl = API_BASE_URL;
  private base = API_ENDPOINTS.ADMIN.REDDIT_INTEGRATION;

  getSettings(): Observable<ApiResponse<RedditIntegrationSettings>> {
    return this.http.get<ApiResponse<RedditIntegrationSettings>>(`${this.apiUrl}${this.base}`);
  }

  getStatus(): Observable<ApiResponse<RedditIntegrationStatus>> {
    return this.http.get<ApiResponse<RedditIntegrationStatus>>(`${this.apiUrl}${this.base}/status`);
  }

  updateSettings(body: RedditIntegrationUpdate): Observable<ApiResponse<RedditIntegrationSettings>> {
    return this.http.put<ApiResponse<RedditIntegrationSettings>>(`${this.apiUrl}${this.base}`, body);
  }

  testConnection(): Observable<ApiResponse<RedditIntegrationSettings>> {
    return this.http.post<ApiResponse<RedditIntegrationSettings>>(`${this.apiUrl}${this.base}/test`, {});
  }

  fetchNow(): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}${this.base}/fetch-now`, {});
  }
}
