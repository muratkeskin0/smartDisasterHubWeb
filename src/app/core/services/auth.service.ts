/**
 * Authentication Service
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { API_ENDPOINTS } from '../../constants/api';
import { STORAGE_KEYS } from '../../constants/storage';
import { LoginCredentials, RegisterData, AuthResponse, User, ApiResponse, ProfileUpdateData } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8082';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private logoutTimer: ReturnType<typeof setTimeout> | null = null;

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
      if (this.isTokenExpired(storedToken)) {
        this.clearAuthData();
        return;
      }

      try {
        const user = JSON.parse(storedUser) as User;
        this.currentUserSubject.next(user);
        this.scheduleAutoLogout(storedToken);
      } catch (e) {
        console.error('User parse error:', e);
        this.clearAuthData();
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
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return !!token && !this.isTokenExpired(token) && !!this.currentUserSubject.value;
  }

  /**
   * Check if user is admin
   */
  get isAdmin(): boolean {
    return this.currentUserSubject.value?.role?.name === 'ADMIN';
  }

  get isManager(): boolean {
    return this.currentUserSubject.value?.role?.name === 'MANAGER';
  }

  get isStaff(): boolean {
    return this.isAdmin || this.isManager;
  }

  /** Default home after login: admins → dashboard, managers → moderation, BASIC → about. */
  get defaultHomeRoute(): string {
    if (this.isAdmin) {
      return '/dashboard';
    }
    if (this.isManager) {
      return '/moderation';
    }
    return '/complaints/new';
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
          if (response.success && response.data?.token && response.data?.user) {
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
            this.currentUserSubject.next(response.data.user);
            this.scheduleAutoLogout(response.data.token);
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
          // Registration now requires email activation; do not create session here.
          if (response.success) {
            this.clearAuthData();
          }
        })
      );
  }

  activateEmail(token: string): Observable<ApiResponse<void>> {
    return this.http.get<ApiResponse<void>>(`${this.apiUrl}${API_ENDPOINTS.AUTH.ACTIVATE}?token=${encodeURIComponent(token)}`);
  }

  /**
   * User logout
   */
  logout(callLogoutApi = true): void {
    this.clearAuthData();

    if (!callLogoutApi) {
      return;
    }

    this.http.post<ApiResponse<any>>(`${this.apiUrl}${API_ENDPOINTS.AUTH.LOGOUT}`, {}).subscribe({
      next: () => {
        // Logout successful on server
      },
      error: (err) => {
        // Ignore errors - logout is primarily client-side for JWT
        console.debug('Logout API call error (ignored):', err);
      }
    });
  }

  /**
   * Verify token
   */
  verifyToken(): Observable<ApiResponse<{ valid: boolean }>> {
    return this.http.get<ApiResponse<{ valid: boolean }>>(`${this.apiUrl}${API_ENDPOINTS.AUTH.VERIFY}`);
  }

  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}${API_ENDPOINTS.USER.PROFILE}`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setCurrentUser(response.data);
        }
      })
    );
  }

  updateProfile(data: ProfileUpdateData): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}${API_ENDPOINTS.USER.PROFILE}`, data).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setCurrentUser(response.data);
        }
      })
    );
  }

  cancelPendingEmailChange(): Observable<ApiResponse<User>> {
    return this.http.delete<ApiResponse<User>>(`${this.apiUrl}${API_ENDPOINTS.USER.CANCEL_PENDING_EMAIL}`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setCurrentUser(response.data);
        }
      })
    );
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private clearAuthData(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    this.currentUserSubject.next(null);
    this.clearLogoutTimer();
  }

  private clearLogoutTimer(): void {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
  }

  private scheduleAutoLogout(token: string): void {
    this.clearLogoutTimer();
    const expiration = this.getTokenExpirationTime(token);

    if (!expiration) {
      return;
    }

    const delay = expiration - Date.now();
    if (delay <= 0) {
      this.logout(false);
      return;
    }

    this.logoutTimer = setTimeout(() => {
      this.logout(false);
    }, delay);
  }

  private getTokenExpirationTime(token: string): number | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }

      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
      const decodedPayload = atob(paddedPayload);
      const parsedPayload = JSON.parse(decodedPayload) as { exp?: number };

      if (!parsedPayload.exp) {
        return null;
      }

      return parsedPayload.exp * 1000;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpirationTime(token);
    if (!expiration) {
      return false;
    }

    return expiration <= Date.now();
  }
}

