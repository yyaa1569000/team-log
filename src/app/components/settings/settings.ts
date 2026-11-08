import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, SystemSettings } from '../../services/settings';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { TutorialService } from '../../services/tutorial.service';

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
  tutorialService = inject(TutorialService);
  private http = inject(HttpClient);

  toastMessage = signal('');
  accountToastMessage = signal('');

  formData: SystemSettings = {
    workspaceName: '',
    dailyReminder: false,
    pushNotification: false,
  };

  userFormData = {
    name: '',
    username: '',
    password: '',
    currentPassword: '', 
  };

  tourSteps = [
    { 
      id: 'tour-save-system', 
      title: '✨ 儲存系統設定', 
      content: '在這裡可以修改整體工作區的名稱，點擊此按鈕即可將設定同步儲存至資料庫。', 
      position: 'top',
      action: () => {} 
    },
    { 
      id: 'tour-save-account', 
      title: '✨ 更新個人帳號密碼', 
      content: '在這裡可以隨時更改您的登入姓名、帳號或密碼，保障帳號安全性。', 
      position: 'top',
      action: () => {} 
    }
  ];
  currentTourStep = signal(0);
  tooltipPos = signal({ top: 0, left: 0 });

  constructor() {
    effect(() => {
      const data = this.settingsService.settings();
      if (data) {
        this.formData = { ...data };
      }
    });

    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.userFormData.name = user.name || '';
        this.userFormData.username = user.username || '';
        this.userFormData.currentPassword = user.password || '123456'; 
        this.userFormData.password = ''; 
      }
    });

    effect(() => {
      if (this.tutorialService.isActive()) {
        setTimeout(() => this.updateTourPosition(), 50); 
      } else {
        this.clearHighlight();
      }
    });
  }

  updateTourPosition() {
    this.clearHighlight();
    const step = this.tourSteps[this.currentTourStep()];
    const targetEl = document.getElementById(step.id);
    
    if (targetEl) {
      targetEl.classList.add('tour-highlight-active');
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => {
        const targetRect = targetEl.getBoundingClientRect();
        const tooltipEl = document.querySelector('.tour-tooltip') as HTMLElement;
        const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 300; 
        const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 200; 

        const targetCenterX = targetRect.left + (targetRect.width / 2);
        let left = targetCenterX - (tooltipWidth / 2);
        
        if (left < 10) left = 10;
        const maxLeft = window.innerWidth - tooltipWidth - 10;
        if (left > maxLeft) left = maxLeft;

        let top = 0;
        if (step.position === 'bottom') {
          top = targetRect.bottom + 15; 
        } else if (step.position === 'top') {
          top = targetRect.top - tooltipHeight - 15; 
        }

        this.tooltipPos.set({ top, left });
      }, 150);
    }
  }

  clearHighlight() {
    document.querySelectorAll('.tour-highlight-active').forEach(el => {
      el.classList.remove('tour-highlight-active');
    });
  }

  nextTourStep() {
    if (this.currentTourStep() < this.tourSteps.length - 1) {
      this.currentTourStep.set(this.currentTourStep() + 1);
    } else {
      this.tutorialService.stopTutorial();
    }
  }

  ngOnInit() {
    this.settingsService.fetchSettings();

    if (this.tutorialService.isTutorialEnabled()) {
      setTimeout(() => {
        this.currentTourStep.set(0);
        this.tutorialService.startTutorial();
      }, 300);
    }
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
        this.authService.currentUser.set(updatedUser);
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.userFormData.password = ''; 
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