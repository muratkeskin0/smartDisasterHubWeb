import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import { ApiResponse, User, UserRole } from '../../models';

export interface ManagerCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  roleId?: number;
  isEmailVerified?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private apiUrl = API_BASE_URL;

  constructor(private http: HttpClient) {}

  listUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}${API_ENDPOINTS.USER.LIST}`);
  }

  listRoles(): Observable<ApiResponse<UserRole[]>> {
    return this.http.get<ApiResponse<UserRole[]>>(`${this.apiUrl}${API_ENDPOINTS.ROLES.LIST}`);
  }

  updateUser(id: number, body: UserUpdateRequest): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}${API_ENDPOINTS.USER.BY_ID(id)}`, body);
  }

  deleteUser(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}${API_ENDPOINTS.USER.BY_ID(id)}`);
  }

  resendActivation(id: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}${API_ENDPOINTS.USER.RESEND_ACTIVATION(id)}`,
      {}
    );
  }

  verifyEmail(id: number): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(
      `${this.apiUrl}${API_ENDPOINTS.USER.VERIFY_EMAIL(id)}`,
      {}
    );
  }

  listManagers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}${API_ENDPOINTS.USER.MANAGERS}`);
  }

  createManager(body: ManagerCreateRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}${API_ENDPOINTS.USER.MANAGERS}`, body);
  }
}
