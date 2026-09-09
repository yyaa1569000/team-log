import { Component, signal, computed} from '@angular/core';
import { LogService } from '../../services/log';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-log-management',
  standalone: true,
  imports: [FormsModule], // 👈 確保有引入 FormsModule
  templateUrl: './log-management.html',
  styleUrl: './log-management.css' 
})
export class LogManagement {
  newTitle = signal('');
  newCategory = signal('開發');
  newContent = signal('');
  searchQuery = signal('');
  selectedCategory = signal('全部');

  // 表單驗證與提示狀態
  showErrors = signal(false);
  toastMessage = signal('');

  constructor(private logService: LogService) {}

  filteredLogs = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();
    
    return this.logService.logs().filter(log => {
      const matchesSearch = log.title.toLowerCase().includes(query) || log.content.toLowerCase().includes(query);
      const matchesCategory = category === '全部' || log.category === category;
      return matchesSearch && matchesCategory;
    });
  });

  submitLog() {
    // 驗證必填欄位
    if (!this.newTitle().trim() || !this.newContent().trim()) {
      this.showErrors.set(true);
      return;
    }

    this.logService.addLog({
      title: this.newTitle().trim(),
      category: this.newCategory(),
      content: this.newContent().trim(),
      date: new Date().toISOString().split('T')[0]
    });

    // 清空表單與錯誤提示
    this.newTitle.set('');
    this.newContent.set('');
    this.showErrors.set(false);

    // 觸發 Toast
    this.toastMessage.set('🎉 日誌已成功提交！');
    setTimeout(() => {
      this.toastMessage.set('');
    }, 3000);
  }
}