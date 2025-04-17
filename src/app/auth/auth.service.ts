// src/app/auth/auth.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'access_token';
  private userIdKey = 'user_id';
  private userNameKey = 'user_name';
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    private jwtHelper: JwtHelperService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  register(email: string, password: string, name: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { email, password, name });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<{token: string, user_id: string, name: string}>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          this.setSession(response);
          this.isAuthenticatedSubject.next(true);
        })
      );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userIdKey);
      localStorage.removeItem(this.userNameKey);
    }
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean {
    return this.hasValidToken();
  }

  getUserId(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.userIdKey);
  }

  getUserName(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.userNameKey);
  }

  private setSession(authResult: {token: string, user_id: string, name: string}): void {
    if (this.isBrowser) {
      localStorage.setItem(this.tokenKey, authResult.token);
      localStorage.setItem(this.userIdKey, authResult.user_id);
      localStorage.setItem(this.userNameKey, authResult.name);
    }
  }

  private hasValidToken(): boolean {
    if (!this.isBrowser) return false;
    
    const token = localStorage.getItem(this.tokenKey);
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }
}