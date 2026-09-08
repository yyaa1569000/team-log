import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  // 注入 Router
  constructor(private router: Router) {}

  onLogin() {
    // 這裡未來可以加驗證，目前先直接跳轉到 dashboard
    console.log('按鈕被點擊了');
    this.router.navigate(['/dashboard']);
  }
}
