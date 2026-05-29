import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import {
  ApiResponse,
  Complaint,
  ComplaintCreateRequest,
  ComplaintStats
} from '../../models';
import { ComplaintInboxScope } from '../../constants/roles';
import { PageResponse } from './text-analysis.service';

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private http = inject(HttpClient);
  private apiUrl = API_BASE_URL;
  private statsSubject = new BehaviorSubject<ComplaintStats | null>(null);

  readonly stats$ = this.statsSubject.asObservable();

  get statsSnapshot(): ComplaintStats | null {
    return this.statsSubject.value;
  }

  create(body: ComplaintCreateRequest): Observable<ApiResponse<Complaint>> {
    return this.http.post<ApiResponse<Complaint>>(`${this.apiUrl}${API_ENDPOINTS.COMPLAINTS.BASE}`, body);
  }

  getMine(
    page = 0,
    size = 20,
    sortBy = 'createdAt',
    sortDirection: 'ASC' | 'DESC' = 'DESC'
  ): Observable<ApiResponse<PageResponse<Complaint>>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    return this.http.get<ApiResponse<PageResponse<Complaint>>>(
      `${this.apiUrl}${API_ENDPOINTS.COMPLAINTS.MINE}`,
      { params }
    );
  }

  getById(id: number): Observable<ApiResponse<Complaint>> {
    return this.http.get<ApiResponse<Complaint>>(`${this.apiUrl}${API_ENDPOINTS.COMPLAINTS.BASE}/${id}`);
  }

  getInboxStats(): Observable<ApiResponse<ComplaintStats>> {
    return this.http.get<ApiResponse<ComplaintStats>>(`${this.apiUrl}${API_ENDPOINTS.COMPLAINTS.INBOX_STATS}`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.statsSubject.next(res.data);
        }
      })
    );
  }

  refreshStats(): Observable<ApiResponse<ComplaintStats>> {
    return this.getInboxStats();
  }

  getInbox(
    page = 0,
    size = 20,
    sortBy = 'createdAt',
    sortDirection: 'ASC' | 'DESC' = 'DESC',
    scope?: ComplaintInboxScope
  ): Observable<ApiResponse<PageResponse<Complaint>>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (scope) {
      params = params.set('scope', scope);
    }
    return this.http.get<ApiResponse<PageResponse<Complaint>>>(
      `${this.apiUrl}${API_ENDPOINTS.COMPLAINTS.INBOX}`,
      { params }
    );
  }

  claim(id: number): Observable<ApiResponse<Complaint>> {
    return this.http.post<ApiResponse<Complaint>>(`${this.apiUrl}${API_ENDPOINTS.COMPLAINTS.INBOX}/${id}/claim`, {});
  }

  release(id: number): Observable<ApiResponse<Complaint>> {
    return this.http.post<ApiResponse<Complaint>>(`${this.apiUrl}${API_ENDPOINTS.COMPLAINTS.INBOX}/${id}/release`, {});
  }

  resolve(id: number, notes?: string): Observable<ApiResponse<Complaint>> {
    return this.http.post<ApiResponse<Complaint>>(
      `${this.apiUrl}${API_ENDPOINTS.COMPLAINTS.INBOX}/${id}/resolve`,
      notes ? { notes } : {}
    );
  }
}
