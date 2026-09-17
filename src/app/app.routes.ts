import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { TeamManagementComponent } from './components/team-management/team-management';
import { Settings } from './components/settings/settings';
import { LogManagement } from './components/log-management/log-management'; 
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { 
    path: 'dashboard', 
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      // 💡 保持空白或 redirect 即可，不要把 Dashboard 元件再塞進來
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', redirectTo: '', pathMatch: 'full' }, // 導回父層顯示總覽
      { path: 'logs', component: LogManagement },
      { path: 'team', component: TeamManagementComponent },
      { path: 'settings', component: Settings }
    ]
  },
  { path: '**', redirectTo: 'login' }
];