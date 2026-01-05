import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import { ApiResponse, About } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class AboutService {
  private http = inject(HttpClient);
  private baseUrl = API_BASE_URL;

  getAbout(): Observable<About> {
    return this.http.get<ApiResponse<About>>(`${this.baseUrl}${API_ENDPOINTS.ABOUT.GET}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch about content');
      })
    );
  }

  updateAbout(about: About): Observable<About> {
    return this.http.put<ApiResponse<About>>(`${this.baseUrl}${API_ENDPOINTS.ABOUT.UPDATE}`, about).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to update about content');
      })
    );
  }

  createAbout(about: About): Observable<About> {
    return this.http.post<ApiResponse<About>>(`${this.baseUrl}${API_ENDPOINTS.ABOUT.CREATE}`, about).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to create about content');
      })
    );
  }
}




