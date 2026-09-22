import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { LogService } from '../../services/log';
import { SettingsService } from '../../services/settings';
import { filter } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ConfirmModalComponent],
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

  // 💡 閒置自動登出設定改為 20 分鐘 (20 * 60 * 1000 毫秒)
  private idleTimeout: any;
  private countdownInterval: any;
  private readonly IDLE_TIME_LIMIT = 20 * 60 * 1000; 
  private boundResetTimer = this.resetIdleTimer.bind(this);

  // 剩餘秒數 Signal (初始值為 20 分鐘的總秒數)
  remainingSeconds = signal(this.IDLE_TIME_LIMIT / 1000);

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

  // 重置閒置計時器與倒數計時
  resetIdleTimer() {
    clearTimeout(this.idleTimeout);
    clearInterval(this.countdownInterval);

    // 重置剩餘秒數
    this.remainingSeconds.set(this.IDLE_TIME_LIMIT / 1000);

    // 啟動每秒扣 1 的倒數
    this.countdownInterval = setInterval(() => {
      const current = this.remainingSeconds();
      if (current > 0) {
        this.remainingSeconds.set(current - 1);
      }
    }, 1000);

    // 啟動最終自動登出計時
    this.idleTimeout = setTimeout(() => {
      this.performAutoLogout();
    }, this.IDLE_TIME_LIMIT);
  }

  clearIdleListener() {
    clearTimeout(this.idleTimeout);
    clearInterval(this.countdownInterval);
    window.removeEventListener('mousemove', this.boundResetTimer);
    window.removeEventListener('keydown', this.boundResetTimer);
    window.removeEventListener('click', this.boundResetTimer);
    window.removeEventListener('scroll', this.boundResetTimer);
    window.removeEventListener('touchstart', this.boundResetTimer);
  }

  performAutoLogout() {
    this.clearIdleListener();
    this.isAutoLogoutModalOpen.set(true);
  }

  onConfirmAutoLogout() {
    this.isAutoLogoutModalOpen.set(false);
    this.authService.logout();
  }

  onCancelAutoLogout() {
    this.isAutoLogoutModalOpen.set(false);
    this.authService.logout();
  }

  logout() {
    this.authService.logout();
  }
}