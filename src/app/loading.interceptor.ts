import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoadingService } from './loading.service';
import { finalize } from 'rxjs/operators';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  // 呼叫共用 show，但會被 Service 的防呆保護住 AI 文字
  loadingService.show();

  return next(req).pipe(
    finalize(() => loadingService.hide())
  );
};