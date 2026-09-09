import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // 1. 判斷目前是否在瀏覽器環境
  if (isPlatformBrowser(platformId)) {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (isLoggedIn) {
      return true;
    } else {
      router.navigate(['/login']);
      return false;
    }
  }

  // 2. 如果在伺服器端 (SSR)，預設先擋下或不處理，等待客戶端接管
  return false;
};