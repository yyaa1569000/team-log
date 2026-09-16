import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

export interface DashboardStats {
  todayLogStatus: string;
  teamMemberCount: number;
  systemStatus: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  
  // 初始值維持安全的預設骨架，避免非同步載入空窗期噴錯
  stats = signal<DashboardStats>({
    todayLogStatus: '載入中...',
    teamMemberCount: 0,
    systemStatus: '檢查中...'
  });

  // 串接真實後端 API
  fetchStats() {
    // 依據你的 Spring Boot API 實際路徑調整（例如 '/api/dashboard/stats'）
    this.http.get<DashboardStats>('/api/dashboard/stats').pipe(
      catchError(error => {
        console.error('取得儀表板統計數據失敗:', error);
        // 如果 API 失敗，給予友善的錯誤狀態，避免畫面崩潰
        return of({
          todayLogStatus: '載入失敗 ❌',
          teamMemberCount: 0,
          systemStatus: '連線異常 🔴'
        });
      })
    ).subscribe(data => {
      this.stats.set(data);
    });
  }
}