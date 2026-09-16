import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service'; 

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService); 

  // 判斷目前是否在瀏覽器環境 (保留你的 SSR 處理)
  if (isPlatformBrowser(platformId)) {
    // 改用 AuthService 判斷是否有 currentUser
    if (authService.isLoggedIn()) {
      return true;
    } else {
      router.navigate(['/login']);
      return false;
    }
  }

  // 伺服器端 (SSR) 預設先擋下
  return false;
};