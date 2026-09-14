import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogService } from '../../services/log';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-log-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
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

  // 控制 Modal 彈窗
  showDeleteModal = signal(false);
  deletingLogId = signal<number | null>(null);

  // 取得今天的日期字串 (YYYY-MM-DD)
  todayDate = new Date().toISOString().split('T')[0];

  // 檢視模式
  viewMode = signal<'today' | 'history'>('today');

  // 歷史紀錄日期篩選
  startDateFilter = signal<string>('');
  endDateFilter = signal<string>('');

  showWarningModal = signal<boolean>(false);
  warningMessage = signal<string>('');

  // 編輯 ID 狀態
  editingLogId = signal<number | null>(null);

  // 起始日期防呆
  onStartDateChange(event: any) {
    const selectedDate = event.target.value;
    const currentEnd = this.endDateFilter();

    if (currentEnd && selectedDate > currentEnd) {
      this.warningMessage.set('開始日期不能晚於結束日期！');
      this.showWarningModal.set(true);
      event.target.value = this.startDateFilter();
      return;
    }

    this.startDateFilter.set(selectedDate);
    if (!currentEnd) {
      this.endDateFilter.set(selectedDate);
    }
  }

  // 結束日期防呆
  onEndDateChange(event: any) {
    const selectedEndDate = event.target.value;
    const currentStart = this.startDateFilter();

    if (currentStart && selectedEndDate && selectedEndDate < currentStart) {
      this.warningMessage.set('結束日期不能早於開始日期！');
      this.showWarningModal.set(true);
      this.endDateFilter.set(currentStart);
      event.target.value = currentStart;
    } else {
      this.endDateFilter.set(selectedEndDate);
    }
  }

  closeWarningModal() {
    this.showWarningModal.set(false);
  }

  // 💡 取得日誌顯示日期的輔助函式（防止 HTML 解析報錯）
  getLogDate(log: any): string {
    if (log.date) return log.date;
    if (log.createdAt) return String(log.createdAt).substring(0, 10);
    return '';
  }

  // 💡 核心計算屬性：篩選 + 依日期降冪排序
  filteredLogs = computed(() => {
    const mode = this.viewMode();
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();
    const start = this.startDateFilter();
    const end = this.endDateFilter();

    return this.logService
      .logs()
      .filter((log) => {
        const logDateOnly = this.getLogDate(log);

        if (mode === 'today') {
          if (logDateOnly !== this.todayDate) return false;
        } else {
          if (start && logDateOnly < start) return false;
          if (end && logDateOnly > end) return false;
        }

        const matchesCategory = category === '全部' || log.category === category;
        const matchesSearch =
          !query ||
          log.title.toLowerCase().includes(query) ||
          log.content.toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
      })
      // 💡 最新日期排最前面（降冪排序）
      .sort((a, b) => {
        const dateA = new Date(this.getLogDate(a)).getTime();
        const dateB = new Date(this.getLogDate(b)).getTime();
        return dateA - dateB;
      });
  });

  ngOnInit() {
    this.logService.fetchLogs();
  }

submitLog() {
    // 欄位驗證
    if (!this.newTitle().trim() || !this.newContent().trim() || !this.newHours()) {
      this.showErrors.set(true);
      return;
    }

    const editId = this.editingLogId();

    if (editId) {
      // 💡【儲存變更】邏輯
      // 先找出原本的日誌資料，保留原本的日期或其它屬性
      const originalLog = this.logService.logs().find((l) => l.id === editId);

      const updatedLogData = {
        ...originalLog,
        title: this.newTitle().trim(),
        category: this.newCategory(),
        hours: Number(this.newHours()) || 0,
        content: this.newContent().trim(),
        date: originalLog?.date || this.todayDate, // 保留原本日期
      };

      this.logService.updateLog(editId, updatedLogData).subscribe({
        next: () => {
          this.toastMessage.set('✏️ 成功更新工作日誌！');
          this.cancelEdit(); // 儲存成功後清空表單，恢復成新增狀態
          setTimeout(() => this.toastMessage.set(''), 3000);
        },
        error: (err) => console.error('更新失敗：', err),
      });
    } else {
      // 💡【新增日誌】邏輯
      const newLogData = {
        title: this.newTitle().trim(),
        category: this.newCategory(),
        hours: Number(this.newHours()) || 0,
        content: this.newContent().trim(),
        date: this.todayDate,
      };

      this.logService.addLog(newLogData).subscribe({
        next: () => {
          this.toastMessage.set('🎉 成功新增工作日誌！');
          this.cancelEdit();
          setTimeout(() => this.toastMessage.set(''), 3000);
        },
        error: (err) => console.error('寫入失敗：', err),
      });
    }
  }

  openDeleteModal(id?: number) {
    if (!id) return;
    this.deletingLogId.set(id);
    this.showDeleteModal.set(true);
  }

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

  // 點擊編輯按鈕
  startEdit(log: any) {
    const logDate = this.getLogDate(log);

    // 💡 1. 防呆檢查：若不是當日日誌，禁止編輯並跳出警告訊息
    if (logDate !== this.todayDate) {
      this.warningMessage.set('⚠️ 僅能編輯當日的工作日誌，歷史紀錄無法修改！');
      this.showWarningModal.set(true);
      return;
    }

    // 💡 2. 若為當日日誌：自動切換至「今日工作填寫」頁籤並載入資料
    this.viewMode.set('today');
    this.editingLogId.set(log.id);
    this.newTitle.set(log.title);
    this.newCategory.set(log.category);
    this.newHours.set(log.hours);
    this.newContent.set(log.content);
    this.showErrors.set(false);

    // 💡 3. 平滑捲動至頂部表單
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingLogId.set(null);
    this.newTitle.set('');
    this.newCategory.set('開發');
    this.newHours.set(1);
    this.newContent.set('');
    this.showErrors.set(false);
  }

  totalHours = computed(() =>
    this.filteredLogs().reduce((sum, log) => sum + (Number(log.hours) || 0), 0)
  );

  totalLogsCount = computed(() => this.filteredLogs().length);

  devCategoryHours = computed(() =>
    this.filteredLogs()
      .filter((log) => log.category === '開發')
      .reduce((sum, log) => sum + (Number(log.hours) || 0), 0)
  );

  filterStatusText = computed(() => {
    const start = this.startDateFilter();
    const end = this.endDateFilter();

    if (start && end) return `目前顯示：${start} ～ ${end}`;
    if (start) return `目前顯示：${start} 之後`;
    if (end) return `目前顯示：${end} 之前`;
    return '目前顯示：全部歷史紀錄';
  });
}