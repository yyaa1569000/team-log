import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from './loading.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loadingService.isLoading$ | async" class="overlay">
      <div class="spinner"></div>
      <p>連線中，請稍候...</p>
    </div>
  `,
  styles: [`
    .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; color: white; font-family: sans-serif; }
    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 15px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class LoadingSpinnerComponent {
  loadingService = inject(LoadingService);
}