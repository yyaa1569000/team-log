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
      // 移除原本的 redirectTo: 'team'
      { path: 'logs', component: LogManagement },
      { path: 'team', component: TeamManagementComponent },
      { path: 'settings', component: Settings }
    ]
  },
  { path: '**', redirectTo: 'login' }
];