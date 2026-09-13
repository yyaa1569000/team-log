import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="modal-backdrop" (click)="onCancel()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-icon">{{ icon }}</div>
          <h3>{{ title }}</h3>
          <p>{{ message }}</p>
          
          <div class="modal-actions">
            <button class="btn-cancel" (click)="onCancel()">{{ cancelText }}</button>
            <button [class]="'btn-confirm ' + confirmBtnClass" (click)="onConfirm()">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrls: ['./confirm-modal.component.css']
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = '確認執行此操作？';
  @Input() message = '執行後可能無法復原，您確定要繼續嗎？';
  @Input() icon = '⚠️';
  @Input() confirmText = '確認';
  @Input() cancelText = '取消';
  @Input() confirmBtnClass = 'btn-danger'; // 可傳入不同顏色樣式 (如 btn-danger, btn-primary)

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }
}