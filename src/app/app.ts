import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
// ⭐ 1. 新增這行：引入轉圈圈元件
import { LoadingSpinnerComponent } from './loading-spinner.component'; 

@Component({
  selector: 'app-root',
  standalone: true,
  // ⭐ 2. 在陣列最後面補上 LoadingSpinnerComponent
  imports: [RouterOutlet, CommonModule, LoadingSpinnerComponent], 
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  authService = inject(AuthService);

  logout() {
    this.authService.logout();
  }
}