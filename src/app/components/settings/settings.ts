import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings {
  workspaceName = signal('TeamLog 核心研發團隊');
  notificationsEnabled = signal(true);
  savedMessage = '';

  saveSettings() {
    this.savedMessage = '設定已成功儲存！';
    setTimeout(() => {
      this.savedMessage = '';
    }, 2500);
  }
}