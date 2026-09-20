import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoadingService } from './loading.service';
import { finalize } from 'rxjs/operators';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  loadingService.show(); // 發送請求時顯示

  return next(req).pipe(
    finalize(() => loadingService.hide()) // 請求結束時隱藏
  );
};