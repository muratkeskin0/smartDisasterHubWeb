/**
 * Authentication Service
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { API_ENDPOINTS } from '../../constants/api';
import { STORAGE_KEYS } from '../../constants/storage';
import { LoginCredentials, RegisterData, AuthResponse, User, ApiResponse } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8082';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initAuth();
  }

  /**
   * Initialize auth from localStorage
   */
  private initAuth(): void {
    const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);

    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('User parse error:', e);
        this.logout();
      }
    }
  }

  /**
   * Get current user
   */
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) && !!this.currentUserSubject.value;
  }

  /**
   * Check if user is admin
   */
  get isAdmin(): boolean {
    return this.currentUserSubject.value?.role?.name === 'ADMIN';
  }

  /**
   * Get user full name
   */
  get userFullName(): string {
    const user = this.currentUserSubject.value;
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`;
  }

  /**
   * User login
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}${API_ENDPOINTS.AUTH.LOGIN}`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
            this.currentUserSubject.next(response.data.user);
          }
        })
      );
  }

  /**
   * User registration
   */
  register(userData: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}${API_ENDPOINTS.AUTH.REGISTER}`, userData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
            this.currentUserSubject.next(response.data.user);
          }
        })
      );
  }

  /**
   * User logout
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    this.currentUserSubject.next(null);
    
    // Optional: Call logout API
    this.http.post<ApiResponse>(`${this.apiUrl}${API_ENDPOINTS.AUTH.LOGOUT}`, {}).subscribe();
  }

  /**
   * Verify token
   */
  verifyToken(): Observable<ApiResponse<{ valid: boolean }>> {
    return this.http.get<ApiResponse<{ valid: boolean }>>(`${this.apiUrl}${API_ENDPOINTS.AUTH.VERIFY}`);
  }
}

