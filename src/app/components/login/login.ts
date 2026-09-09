import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private router = inject(Router);

  email = signal('');
  password = signal('');
  errorMessage = signal('');

  onLogin() {
    // 檢查欄位是否填寫
    if (!this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('請輸入電子郵件與密碼！');
      return;
    }

    // 寫入登入狀態並跳轉
    localStorage.setItem('isLoggedIn', 'true');
    this.errorMessage.set('');
    this.router.navigate(['/dashboard']);
  }
}