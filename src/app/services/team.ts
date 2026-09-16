import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DashboardService } from './dashboard.service';

export interface User {
  id?: number;
  name: string;
  username?: string;
  password?: string;
  role?: string; // "ADMIN" | "USER"
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private http = inject(HttpClient);
  private dashboardService = inject(DashboardService);

  users = signal<User[]>([]);

  fetchUsers() {
    this.http.get<User[]>('/api/users').subscribe({
      next: (data) => this.users.set(data),
      error: (err) => console.error('取得成員失敗:', err)
    });
  }

  addUser(userPayload: { name: string; username?: string }) {
    this.http.post<User>('/api/users', userPayload).subscribe({
      next: (newUser) => {
        this.users.update(list => [...list, newUser]);
        this.dashboardService.fetchStats();
      },
      error: (err) => console.error('新增成員失敗:', err)
    });
  }

  deleteUser(id: number, callback?: () => void) {
    this.http.delete(`/api/users/${id}`).subscribe({
      next: () => {
        this.users.update(list => list.filter(user => user.id !== id));
        this.dashboardService.fetchStats();
        if (callback) callback();
      },
      error: (err) => console.error('刪除成員失敗:', err)
    });
  }
}