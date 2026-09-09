import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LogManagement } from '../log-management/log-management'; // 日誌元件
import { TeamManagement } from '../team-management/team-management';
import { Settings } from '../settings/settings';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [LogManagement, TeamManagement, Settings],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  constructor(private router: Router) {}
  currentTab = 'overview';
  switchTab(tab: string) {
    this.currentTab = tab;
  }
logout() {
  localStorage.removeItem('isLoggedIn');
  this.router.navigate(['/login']);
}
}
