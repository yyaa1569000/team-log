import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Log {
  id: number;
  title: string;
  category: string;
  hours: number;
  content: string;
  date: string;
  username?: string;
  authorName?: string;
  aiSummary?: string; 
}

@Injectable({
  providedIn: 'root',
})
export class LogService {
  private http = inject(HttpClient);
  private apiUrl = '/api/logs';

  logs = signal<Log[]>([]);

  // 取得資料庫所有日誌
  fetchLogs() {
    this.http
      .get<Log[]>(this.apiUrl)
      .pipe(
        tap((data) => this.logs.set(data)),
        catchError((error) => {
          console.error('無法連線至後端 API', error);
          return of([]);
        }),
      )
      .subscribe();
  }

  // 新增日誌
  addLog(newLog: Omit<Log, 'id'>) {
    return this.http.post<Log>(this.apiUrl, newLog).pipe(
      tap((savedLog) => {
        this.logs.update((current) => [savedLog, ...current]);
      }),
    );
  }
  // 刪除日誌
  deleteLog(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.logs.update((current) => current.filter((log) => log.id !== id));
      }),
    );
  }
  // 編輯日誌
  updateLog(id: number, logData: Partial<Log>) {
    // 發送 PUT 請求至後端 API 更新指定 ID 的日誌資料
    return this.http.put<Log>(`${this.apiUrl}/${id}`, logData).pipe(
      tap((updatedLog) => {
        // 透過 map 走訪陣列，將對應 ID 的項目替換為後端回傳的更新後資料
        this.logs.update((current) => current.map((log) => (log.id === id ? updatedLog : log)));
      }),
    );
  }
  
}
