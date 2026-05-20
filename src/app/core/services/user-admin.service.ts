import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import { ApiResponse, User } from '../../models';

export interface ManagerCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private apiUrl = API_BASE_URL;

  constructor(private http: HttpClient) {}

  listManagers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}${API_ENDPOINTS.USER.MANAGERS}`);
  }

  createManager(body: ManagerCreateRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}${API_ENDPOINTS.USER.MANAGERS}`, body);
  }
}
