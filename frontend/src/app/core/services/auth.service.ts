import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { User } from '../models/user.model';

interface AuthPayload {
  token: string;
  user: User;
}

const TOKEN_KEY = 'feva_token';
const USER_KEY = 'feva_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly currentUserSignal = signal<User | null>(this.readStoredUser());
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');
  readonly isSuperAdmin = computed(
    () => this.currentUserSignal()?.role === 'admin' && !!this.currentUserSignal()?.isSuperAdmin
  );
  readonly isOrganizer = computed(() => this.currentUserSignal()?.role === 'organizer');
  readonly isStaff = computed(() =>
    ['admin', 'staff', 'organizer'].includes(this.currentUserSignal()?.role ?? '')
  );

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  register(payload: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
  }): Observable<ApiResponse<AuthPayload>> {
    return this.http
      .post<ApiResponse<AuthPayload>>(`${this.baseUrl}/register`, payload)
      .pipe(tap((res) => this.persistSession(res.data)));
  }

  /** `identifier` may be either an email address or a Kenyan phone number. */
  login(identifier: string, password: string): Observable<ApiResponse<AuthPayload>> {
    return this.http
      .post<ApiResponse<AuthPayload>>(`${this.baseUrl}/login`, { identifier, password })
      .pipe(tap((res) => this.persistSession(res.data)));
  }

  forgotPassword(email: string): Observable<ApiResponse<{ resetUrl?: string }>> {
    return this.http.post<ApiResponse<{ resetUrl?: string }>>(`${this.baseUrl}/forgot-password`, {
      email,
    });
  }

  resetPassword(token: string, password: string): Observable<ApiResponse<AuthPayload>> {
    return this.http
      .post<ApiResponse<AuthPayload>>(`${this.baseUrl}/reset-password`, { token, password })
      .pipe(tap((res) => this.persistSession(res.data)));
  }

  fetchMe(): Observable<ApiResponse<{ user: User }>> {
    return this.http
      .get<ApiResponse<{ user: User }>>(`${this.baseUrl}/me`)
      .pipe(tap((res) => res.data && this.setUser(res.data.user)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setUser(user: User): void {
    this.currentUserSignal.set(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private persistSession(data?: AuthPayload): void {
    if (!data) return;
    localStorage.setItem(TOKEN_KEY, data.token);
    this.setUser(data.user);
  }

  private readStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
