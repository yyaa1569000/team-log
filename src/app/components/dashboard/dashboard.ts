import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common'; // 💡 確保有匯入 CommonModule 以支援 @if 等指令
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { LogService } from '../../services/log';
import { SettingsService } from '../../services/settings';
import { filter } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive], // 💡 補上 CommonModule
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private router = inject(Router);
  logService = inject(LogService);
  settingsService = inject(SettingsService);
  dashboardService = inject(DashboardService);
  authService = inject(AuthService);

  todayDate = new Date().toLocaleDateString('sv');

  // 用來判斷現在是不是在 /dashboard 總覽頁
  isOverview = false;

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // 💡 擴充判斷，涵蓋 /dashboard 及其可能的結尾
        this.isOverview = event.url === '/dashboard' || event.url === '/dashboard/';
      });
  }

  getLogDate(log: any): string {
    if (log.date) return log.date;
    if (log.createdAt) return String(log.createdAt).substring(0, 10);
    return '';
  }

  todayLogsCount = computed(
    () => this.logService.logs().filter((log) => this.getLogDate(log) === this.todayDate).length,
  );

  recentLogs = computed(() => {
    return [...this.logService.logs()]
      .sort((a, b) => {
        const dateA = new Date(this.getLogDate(a)).getTime();
        const dateB = new Date(this.getLogDate(b)).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  });
  

  ngOnInit() {
    this.logService.fetchLogs();
    this.settingsService.fetchSettings();
    this.dashboardService.fetchStats();

    // 初始化先判斷一次當前網址
    const currentUrl = this.router.url;
    this.isOverview = currentUrl === '/dashboard' || currentUrl === '/dashboard/';
    // 1. 每次進到儀表板時抓取一次最新設定
    this.settingsService.fetchSettings();

    // 2. 啟動背景時間檢查器
    this.startReminderChecker();
  }

  startReminderChecker() {
    // 每 30 秒檢查一次當前時間
    setInterval(() => {
      const settings = this.settingsService.settings();
      
      // 檢查是否有點選啟用提醒，且有設定時間
      if (settings && (settings as any).dailyReminder && (settings as any).reminderTime) {
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${currentHours}:${currentMinutes}`;

        console.log('當前時間：', currentTimeStr, '設定時間：', (settings as any).reminderTime);
        // 比對是否符合設定的時間 (例如 "15:02")
        if (currentTimeStr === (settings as any).reminderTime) {
          const lastAlertDate = sessionStorage.getItem('last_reminder_date');
          const todayStr = now.toDateString();

          // 確保今天同一個時間到了只跳出一次提醒
          if (lastAlertDate !== todayStr) {
            sessionStorage.setItem('last_reminder_date', todayStr);
            alert('⏰ 叮咚！設定的時間到了，今天的工作日誌還沒填寫，快去寫日誌吧！');
          }
        }
      }
    }, 30000); // 每 30 秒執行一次
  }

  logout() {
    this.authService.logout();
  }
}
