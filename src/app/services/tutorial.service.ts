import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  // 控制教學是否開啟
  isActive = signal(false);
  
  startTutorial() {
    this.isActive.set(true);
  }

  stopTutorial() {
    this.isActive.set(false);
  }
}