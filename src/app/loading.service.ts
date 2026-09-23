import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.loadingSubject.asObservable();

  private defaultMessage = '連線中，請稍候...';
  private messageSubject = new BehaviorSubject<string>(this.defaultMessage);
  message$ = this.messageSubject.asObservable();

  show(customMsg?: string) {
    if (customMsg) {
      // 如果有指定 AI 訊息，強制切換
      this.messageSubject.next(customMsg);
    } else if (!this.loadingSubject.value) {
      // 如果是預設觸發且目前沒顯示，才用預設文字（避免被 Interceptor 覆蓋）
      this.messageSubject.next(this.defaultMessage);
    }
    this.loadingSubject.next(true);
  }

  hide() {
    this.loadingSubject.next(false);
  }
}