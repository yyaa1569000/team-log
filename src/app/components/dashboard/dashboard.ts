import { Component, OnInit, inject, computed } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { LogService } from '../../services/log';
import { SettingsService } from '../../services/settings';
import { filter } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive], // 💡 這裡不需要再匯入其他子元件了
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private router = inject(Router);
  logService = inject(LogService);
  settingsService = inject(SettingsService);

  todayDate = new Date().toLocaleDateString('sv');
  
  // 💡 用來判斷現在是不是在 /dashboard 總覽頁
  isOverview = false;

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .forEach((event: any) => {
        // 如果網址剛好是 /dashboard 或 /dashboard/，就是總覽
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
    this.isOverview = this.router.url === '/dashboard' || this.router.url === '/dashboard/';
  }

  logout() {
    localStorage.removeItem('isLoggedIn');
    this.router.navigate(['/login']);
  }
}