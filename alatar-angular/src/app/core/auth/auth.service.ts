import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresAtUtc: string;
}

export interface AuthenticatedAdmin {
  email: string;
  role: string;
  expiresAtUtc: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly tokenStorageKey = 'alatar.admin.access_token';
  private readonly expiryStorageKey = 'alatar.admin.access_token_expires_at';

  login(payload: LoginPayload): Observable<void> {
    return this.httpClient
      .post<LoginResponse>(`${this.apiBaseUrl}/api/auth/login`, payload)
      .pipe(
        tap((response) => this.persistSession(response)),
        map(() => void 0)
      );
  }

  getCurrentAdmin(): Observable<AuthenticatedAdmin> {
    return this.httpClient.get<AuthenticatedAdmin>(`${this.apiBaseUrl}/api/auth/me`);
  }

  logout(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.expiryStorageKey);
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  getAccessToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const token = localStorage.getItem(this.tokenStorageKey);
    const expiry = localStorage.getItem(this.expiryStorageKey);

    if (!token || !expiry) {
      return null;
    }

    const expiryTime = Date.parse(expiry);

    if (Number.isNaN(expiryTime) || expiryTime <= Date.now()) {
      this.logout();
      return null;
    }

    return token;
  }

  private persistSession(response: LoginResponse): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.tokenStorageKey, response.accessToken);
    localStorage.setItem(this.expiryStorageKey, response.expiresAtUtc);
  }
}
