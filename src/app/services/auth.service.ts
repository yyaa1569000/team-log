import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User } from './team';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // 修正型別語法：User | null，改用 sessionStorage 確保關閉分頁即清除
  currentUser = signal<User | null>(this.getUserFromStorage());

  login(credentials: { username: string; password: string }): Observable<User> {
    return this.http.post<User>('/api/auth/login', credentials).pipe(
      tap((user) => {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem('currentUser');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('currentUser');
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  private getUserFromStorage(): User | null {
    const data = sessionStorage.getItem('currentUser');
    return data ? JSON.parse(data) : null;
  }
}