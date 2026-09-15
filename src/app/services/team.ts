import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface TeamMember {
  id?: number;
  name: string;
  role: string;
  status: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/team';

  // 全局成員 Signal 狀態
  members = signal<TeamMember[]>([]);

  // 1. 取得最新成員列表
  fetchMembers() {
    this.http.get<TeamMember[]>(this.apiUrl).subscribe({
      next: (data) => this.members.set(data),
      error: (err) => console.error('取得成員列表失敗：', err),
    });
  }

  // 2. 新增成員
  addMember(member: TeamMember) {
    this.http.post<TeamMember>(this.apiUrl, member).subscribe({
      next: (newMember) => {
        this.members.update((list) => [...list, newMember]);
      },
      error: (err) => console.error('新增成員失敗：', err),
    });
  }

  // 3. 刪除成員
  deleteMember(id: number) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.members.update((list) => list.filter((m) => m.id !== id));
      },
      error: (err) => console.error('刪除成員失敗：', err),
    });
  }
}