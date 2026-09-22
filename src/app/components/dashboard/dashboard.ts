import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { LogService } from '../../services/log';
import { SettingsService } from '../../services/settings';
import { filter } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component'; // 💡 依你的實際路徑調整

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ConfirmModalComponent], // 💡 加入共用元件
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private router = inject(Router);
  logService = inject(LogService);
  settingsService = inject(SettingsService);
  dashboardService = inject(DashboardService);
  authService = inject(AuthService);

  todayDate = new Date().toLocaleDateString('sv');
  isOverview = false;

  // 閒置計時設定 (測試用 10 秒)
  private idleTimeout: any;
  private readonly IDLE_TIME_LIMIT = 10 * 1000; 
  private boundResetTimer = this.resetIdleTimer.bind(this);

  // 💡 控制共用 ConfirmModal 的開關與狀態
  isAutoLogoutModalOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
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

    const currentUrl = this.router.url;
    this.isOverview = currentUrl === '/dashboard' || currentUrl === '/dashboard/';

    this.initIdleListener();
  }

  ngOnDestroy() {
    this.clearIdleListener();
  }

  initIdleListener() {
    window.addEventListener('mousemove', this.boundResetTimer);
    window.addEventListener('keydown', this.boundResetTimer);
    window.addEventListener('click', this.boundResetTimer);
    window.addEventListener('scroll', this.boundResetTimer);
    window.addEventListener('touchstart', this.boundResetTimer);

    this.resetIdleTimer();
  }

  resetIdleTimer() {
    clearTimeout(this.idleTimeout);
    this.idleTimeout = setTimeout(() => {
      this.performAutoLogout();
    }, this.IDLE_TIME_LIMIT);
  }

  clearIdleListener() {
    clearTimeout(this.idleTimeout);
    window.removeEventListener('mousemove', this.boundResetTimer);
    window.removeEventListener('keydown', this.boundResetTimer);
    window.removeEventListener('click', this.boundResetTimer);
    window.removeEventListener('scroll', this.boundResetTimer);
    window.removeEventListener('touchstart', this.boundResetTimer);
  }

  // 時間到時觸發，打開共用 Modal
  performAutoLogout() {
    this.clearIdleListener();
    this.isAutoLogoutModalOpen.set(true);
  }

  // 使用者點擊確定（執行登出）
  onConfirmAutoLogout() {
    this.isAutoLogoutModalOpen.set(false);
    this.authService.logout();
  }

  // 因為自動登出不需要取消選項，點取消可以直接導回登入或關閉（或直接當作確認登出）
  onCancelAutoLogout() {
    this.isAutoLogoutModalOpen.set(false);
    this.authService.logout();
  }

  logout() {
    this.authService.logout();
  }
}