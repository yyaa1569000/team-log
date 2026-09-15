import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface SystemSettings {
  id?: number;
  workspaceName: string;
  dailyReminder: boolean;
  pushNotification: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/settings';

  settings = signal<SystemSettings>({
    workspaceName: '載入中...',
    dailyReminder: true,
    pushNotification: false,
  });

  fetchSettings() {
    this.http.get<SystemSettings>(this.apiUrl).subscribe({
      next: (data) => {
        if (data) this.settings.set(data);
      },
      error: (err) => console.error('載入設定失敗：', err),
    });
  }

  updateSettings(data: SystemSettings) {
    return this.http.put<SystemSettings>(this.apiUrl, data);
  }
}