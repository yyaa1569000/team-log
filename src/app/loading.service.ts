import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.loadingSubject.asObservable();

  // 💡 新增：管理目前的 loading 文字
  private defaultMessage = '連線中，請稍候...';
  private messageSubject = new BehaviorSubject<string>(this.defaultMessage);
  message$ = this.messageSubject.asObservable();

  show(customMsg?: string) {
    if (customMsg) {
      // 💡 如果有傳入自訂文字，就使用自訂文字
      this.messageSubject.next(customMsg);
    } else if (!this.loadingSubject.value) {
      // 💡 如果沒有傳入，且目前「還沒」顯示 Loading，才使用預設文字
      // (這樣能防止 Interceptor 蓋掉我們先設定好的 AI 專屬文字)
      this.messageSubject.next(this.defaultMessage);
    }
    this.loadingSubject.next(true);
  }

  hide() {
    this.loadingSubject.next(false);
  }
}