import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, SystemSettings } from '../../services/settings';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  settingsService = inject(SettingsService);
  authService = inject(AuthService);
  private http = inject(HttpClient);

  toastMessage = signal('');
  accountToastMessage = signal('');

  // 1. 系統設定表單資料（已移除 pushNotification，改為 reminderTime）
  formData: any = {
    workspaceName: '',
    dailyReminder: false,
    reminderTime: '17:00',
  };

  // 2. 個人帳號設定表單資料
  userFormData = {
    name: '',
    username: '',
    password: '',
    currentPassword: '', //當前密碼
  };

  constructor() {
    effect(() => {
      const data = this.settingsService.settings();
      if (data) {
        this.formData = {
          ...data,
          reminderTime: (data as any).reminderTime || '17:00',
        };
      }
    });

    // 監聽當前登入者變更，初始化個人帳號與現有密碼
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.userFormData.name = user.name || '';
        this.userFormData.username = user.username || '';
        this.userFormData.currentPassword = user.password || '123456'; // 💡 帶入資料庫密碼
        this.userFormData.password = ''; // 輸入框保持空白讓使用者填新密碼
      }
    });
  }

  ngOnInit() {
    this.settingsService.fetchSettings();
  }

  // 儲存系統設定
  saveSettings() {
    this.settingsService.updateSettings(this.formData as SystemSettings).subscribe({
      next: (res) => {
        if (res) this.settingsService.settings.set(res);
        this.toastMessage.set('⚙️ 系統設定已成功同步至資料庫！');
        setTimeout(() => this.toastMessage.set(''), 3000);
      },
      error: (err) => console.error('更新設定失敗：', err),
    });
  }

  // 儲存個人帳號與密碼變更
  saveAccountSettings() {
    const user = this.authService.currentUser();
    if (!user || !user.id) return;

    const payload = {
      name: this.userFormData.name.trim(),
      username: this.userFormData.username.trim(),
      password: this.userFormData.password.trim() ? this.userFormData.password.trim() : null,
    };

    this.http.put<any>(`/api/users/${user.id}`, payload).subscribe({
      next: (updatedUser) => {
        // 同步更新前端 AuthService 狀態
        this.authService.currentUser.set(updatedUser);
        this.userFormData.password = ''; // 清空密碼欄位
        this.accountToastMessage.set('✨ 個人帳號與密碼更新成功！');
        setTimeout(() => this.accountToastMessage.set(''), 3000);
      },
      error: (err) => {
        console.error('更新個人資料失敗：', err);
        this.accountToastMessage.set('❌ 更新失敗，帳號可能已被使用或伺服器錯誤');
        setTimeout(() => this.accountToastMessage.set(''), 3000);
      },
    });
  }
}
