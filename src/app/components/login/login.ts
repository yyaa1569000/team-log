import { Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  username = signal('');
  password = signal('');
  errorMessage = signal('');

  ngOnInit() {
    // 已登入者若進入 /login，自動跳轉至儀表板團隊頁
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onLogin() {
    if (!this.username().trim() || !this.password().trim()) {
      this.errorMessage.set('請輸入帳號與密碼！');
      return;
    }

    this.errorMessage.set('');

    this.authService.login({
      username: this.username().trim(),
      password: this.password().trim()
    }).subscribe({
      next: () => {
        // 👈 正確導向子路由 /dashboard/team
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        const msg = typeof err.error === 'string' ? err.error : '帳號或密碼錯誤！';
        this.errorMessage.set(msg);
      }
    });
  }
}