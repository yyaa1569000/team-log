import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, SystemSettings } from '../../services/settings';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  settingsService = inject(SettingsService);
  toastMessage = signal('');

  // 💡 這裡不要用 signal()，直接宣告成一般物件即可！
  formData: SystemSettings = {
    workspaceName: '',
    dailyReminder: false,
    pushNotification: false,
  };

  constructor() {
    effect(() => {
      const data = this.settingsService.settings();
      if (data) {
        this.formData = { ...data }; // 當 Service 資料更新時，直接賦值給普通物件
      }
    });
  }

  ngOnInit() {
    this.settingsService.fetchSettings();
  }

  saveSettings() {
    this.settingsService.updateSettings(this.formData).subscribe({
      next: (res) => {
        if (res) this.settingsService.settings.set(res);
        this.toastMessage.set('⚙️ 系統設定已成功同步至資料庫！');
        setTimeout(() => this.toastMessage.set(''), 3000);
      },
      error: (err) => console.error('更新設定失敗：', err),
    });
  }
}