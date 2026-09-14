import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.css']
})
export class ConfirmModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = '提示';
  @Input() message: string = '';
  @Input() confirmText: string = '確定';
  @Input() cancelText: string = '取消';
  
  // 按鈕顏色類型：'danger' (紅) | 'success' (綠) | 'warning' (黃)
  @Input() type: 'danger' | 'success' | 'warning' = 'danger';
  
  // 是否顯示取消按鈕（預設為 true）
  @Input() showCancel: boolean = true;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }
}