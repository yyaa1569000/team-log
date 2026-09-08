import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';

export const routes: Routes = [
  // 1. 當使用者進入根路徑 ('') 時，導向登入頁面
  { path: '', component: Login },

  // 2. 當使用者進入 '/dashboard' 時，導向儀表板頁面
  { path: 'dashboard', component: Dashboard },

  // 3. 萬用路徑：如果輸入不存在的網址，自動導回登入頁面
  { path: '**', redirectTo: '' }
];