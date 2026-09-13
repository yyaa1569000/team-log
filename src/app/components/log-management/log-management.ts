import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogService } from '../../services/log';

// 👈 1. 匯入跨元件 Modal (請依實際 relative path 調整路徑)
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-log-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ConfirmModalComponent, // 👈 2. 加入 imports 陣列
  ],
  templateUrl: './log-management.html',
  styleUrls: ['./log-management.css'],
})
export class LogManagement implements OnInit {
  logService = inject(LogService);

  // 表單與驗證狀態
  newTitle = signal('');
  newCategory = signal('開發');
  newHours = signal<number | string>(1);
  newContent = signal('');
  showErrors = signal(false);
  toastMessage = signal('');

  // 搜尋與分類
  searchQuery = signal('');
  selectedCategory = signal('全部');

  // 👈 3. 新增控制 Modal 彈窗的 Signal 狀態
  showDeleteModal = signal(false);
  deletingLogId = signal<number | null>(null);

  // 取得今天的日期字串 (格式：YYYY-MM-DD)
  todayDate = new Date().toISOString().split('T')[0];

  // 切換目前的檢視模式：'today' (今日填寫) 或 'history' (歷史紀錄)
  viewMode = signal<'today' | 'history'>('today');

  // 歷史紀錄專用的日期篩選 (預設空值代表全部)
  historyDateFilter = signal('');

filteredLogs = computed(() => {
  const mode = this.viewMode();
  const query = this.searchQuery().toLowerCase().trim();
  const category = this.selectedCategory();
  const dateFilter = this.historyDateFilter();
  
  return this.logService.logs().filter(log => {
    // 抓取後端的建立時間 (createdAt)，並截取前 10 碼 (YYYY-MM-DD)
    const logDateOnly = log.createdAt ? String(log.createdAt).substring(0, 10) : '';

    if (mode === 'today') {
      if (logDateOnly !== this.todayDate) return false;
    } else {
      if (dateFilter && logDateOnly !== dateFilter) return false;
    }

    const matchesCategory = category === '全部' || log.category === category;
    const matchesSearch = !query || 
      log.title.toLowerCase().includes(query) || 
      log.content.toLowerCase().includes(query);
      
    return matchesCategory && matchesSearch;
  });
});

  ngOnInit() {
    this.logService.fetchLogs();
  }

  // 提交表單 (兼具新增與更新)
  submitLog() {
    // 驗證必填欄位是否為空
    if (!this.newTitle().trim() || !this.newContent().trim() || !this.newHours()) {
      this.showErrors.set(true);
      return;
    }

    // 整理要送出的表單資料物件
    const logData = {
      title: this.newTitle().trim(),
      category: this.newCategory(),
      hours: Number(this.newHours()) || 0,
      content: this.newContent().trim(),
      date: new Date().toISOString().split('T')[0],
    };

    const editId = this.editingLogId();

    if (editId) {
      // 執行更新日誌邏輯
      this.logService.updateLog(editId, logData).subscribe({
        next: () => {
          this.toastMessage.set('✏️ 成功更新工作日誌！');
          this.cancelEdit();
          setTimeout(() => this.toastMessage.set(''), 3000);
        },
        error: (err) => console.error('更新失敗：', err),
      });
    } else {
      // 執行新增日誌邏輯
      this.logService.addLog(logData).subscribe({
        next: () => {
          this.toastMessage.set('🎉 成功新增工作日誌！');
          this.cancelEdit();
          setTimeout(() => this.toastMessage.set(''), 3000);
        },
        error: (err) => console.error('寫入失敗：', err),
      });
    }
  }

  // 👈 4. 點擊卡片上的刪除按鈕：記錄 ID 並打開 Modal
  openDeleteModal(id?: number) {
    if (!id) return;
    this.deletingLogId.set(id);
    this.showDeleteModal.set(true);
  }

  // 👈 5. 點擊 Modal 中的「確認刪除」：發送 DELETE API 請求
  handleConfirmDelete() {
    const id = this.deletingLogId();
    if (!id) return;

    this.logService.deleteLog(id).subscribe({
      next: () => {
        this.toastMessage.set('🗑️ 已成功刪除日誌！');
        this.showDeleteModal.set(false);
        this.deletingLogId.set(null);

        setTimeout(() => this.toastMessage.set(''), 3000);
      },
      error: (err) => {
        console.error('刪除失敗：', err);
        this.showDeleteModal.set(false);
      },
    });
  }
  // 追蹤目前正在編輯的日誌 ID (null 代表目前是新增模式)
  editingLogId = signal<number | null>(null);

  // 點擊卡片編輯按鈕
  startEdit(log: any) {
    // 記錄目前編輯的 ID 並將資料填入表單欄位
    this.editingLogId.set(log.id);
    this.newTitle.set(log.title);
    this.newCategory.set(log.category);
    this.newHours.set(log.hours);
    this.newContent.set(log.content);
    this.showErrors.set(false);
  }

  // 取消編輯狀態
  cancelEdit() {
    // 清空編輯 ID 並重置表單欄位
    this.editingLogId.set(null);
    this.newTitle.set('');
    this.newCategory.set('開發');
    this.newHours.set(1);
    this.newContent.set('');
    this.showErrors.set(false);
  }
  // 計算總工時
  totalHours = computed(() => {
    return this.logService.logs().reduce((sum, log) => sum + Number(log.hours || 0), 0);
  });

  // 計算總日誌數量
  totalCount = computed(() => {
    return this.logService.logs().length;
  });

  // 計算開發類別的總工時
  devHours = computed(() => {
    return this.logService
      .logs()
      .filter((log) => log.category === '開發')
      .reduce((sum, log) => sum + Number(log.hours || 0), 0);
  });
}
