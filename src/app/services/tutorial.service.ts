import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  // 1. 全域總開關：判斷教學模式是否啟用 (會記在瀏覽器中)
  isTutorialEnabled = signal<boolean>(localStorage.getItem('tutorialEnabled') === 'true');
  
  // 2. 當下狀態：判斷畫面上是否正在播放教學
  isActive = signal<boolean>(false);
  
  // 切換總開關
  toggleEnable(enabled: boolean) {
    this.isTutorialEnabled.set(enabled);
    localStorage.setItem('tutorialEnabled', String(enabled));
  }

  // 開始播放教學
  startTutorial() {
    this.isActive.set(true);
  }

  // 結束當次教學
  stopTutorial() {
    this.isActive.set(false);
  }
}