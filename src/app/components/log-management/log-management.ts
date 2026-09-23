import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogService } from '../../services/log';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { AuthService } from '../../services/auth.service'; // 💡 引入 AuthService

@Component({
  selector: 'app-log-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './log-management.html',
  styleUrls: ['./log-management.css'],
})

export class LogManagement implements OnInit {
  logService = inject(LogService);
  authService = inject(AuthService); // 💡 注入

  newTitle = signal('');
  newCategory = signal('開發');
  newHours = signal<number | string>(1);
  newContent = signal('');
  showErrors = signal(false);
  toastMessage = signal('');

  searchQuery = signal('');
  selectedCategory = signal('全部');
  selectedUser = signal('全部'); // 💡 管理員用的成員篩選狀態

  showDeleteModal = signal(false);
  deletingLogId = signal<number | null>(null);

  get todayDate(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  viewMode = signal<'today' | 'history'>('today');
  startDateFilter = signal<string>('');
  endDateFilter = signal<string>('');

  showWarningModal = signal<boolean>(false);
  warningMessage = signal<string>('');
  editingLogId = signal<number | null>(null);

  Math = Math;

  // 💡 動態提取目前有寫日誌的所有成員名單 (供管理員下拉選單使用)
  uniqueUsers = computed(() => {
    const logs = this.logService.logs();
    const users = logs.map(l => l.authorName).filter(Boolean);
    return [...new Set(users)];
  });

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
    if (!currentEnd) this.endDateFilter.set(selectedDate);
  }

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

  getLogDate(log: any): string {
    if (log.date) return log.date;
    if (log.createdAt) return String(log.createdAt).substring(0, 10);
    return '';
  }

  // 💡 核心過濾器：加上權限與人員篩選
  filteredLogs = computed(() => {
    const mode = this.viewMode();
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();
    const targetUser = this.selectedUser();
    const start = this.startDateFilter();
    const end = this.endDateFilter();
    const today = this.todayDate;
    const currentUser = this.authService.currentUser();

    return this.logService.logs().filter((log) => {
      // 1. RBAC 權限與成員過濾邏輯
      if (currentUser?.role !== 'ADMIN') {
        // 一般成員只能看到自己的日誌
        if (log.username !== currentUser?.username) return false;
      } else {
        // 管理員如果選了特定成員
        if (targetUser !== '全部' && log.authorName !== targetUser) return false;
      }

      // 2. 日期過濾邏輯
      const logDateOnly = this.getLogDate(log);
      if (mode === 'today') {
        if (logDateOnly !== today) return false;
      } else {
        if (start && logDateOnly < start) return false;
        if (end && logDateOnly > end) return false;
      }

      // 3. 分類與關鍵字過濾邏輯
      const matchesCategory = category === '全部' || log.category === category;
      const matchesSearch = !query || 
                            log.title.toLowerCase().includes(query) || 
                            log.content.toLowerCase().includes(query) ||
                            (log.authorName && log.authorName.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      const dateA = new Date(this.getLogDate(a)).getTime();
      const dateB = new Date(this.getLogDate(b)).getTime();
      return dateB - dateA;
    });
  });

  currentPage = signal<number>(1);
  pageSize = signal<number>(14);

  totalPages = computed(() => {
    const total = Math.ceil(this.filteredLogs().length / this.pageSize());
    return total > 0 ? total : 1;
  });

  paginatedLogs = computed(() => {
    const validPage = Math.min(this.currentPage(), this.totalPages());
    const startIndex = (validPage - 1) * this.pageSize();
    return this.filteredLogs().slice(startIndex, startIndex + this.pageSize());
  });

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  private updatePageSize() {
    const width = window.innerWidth;
    let cols = 1;
    if (width >= 1400) cols = 7;
    else if (width >= 1024) cols = 2;
    else if (width >= 640) cols = 2;
    else cols = 1;
    this.pageSize.set(Math.min(cols * 2, 14));
  }

  ngOnInit() {
    this.logService.fetchLogs();
    this.updatePageSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.updatePageSize();
  }

  submitLog() {
    if (!this.newTitle().trim() || !this.newContent().trim() || !this.newHours()) {
      this.showErrors.set(true);
      return;
    }

    const editId = this.editingLogId();
    const currentUser = this.authService.currentUser(); // 💡 取得當前使用者

    if (editId) {
      const originalLog = this.logService.logs().find((l) => l.id === editId);
      const updatedLogData = {
        ...originalLog,
        title: this.newTitle().trim(),
        category: this.newCategory(),
        hours: Number(this.newHours()) || 0,
        content: this.newContent().trim(),
        date: originalLog?.date || this.todayDate,
      };

      this.logService.updateLog(editId, updatedLogData).subscribe({
        next: () => {
          this.toastMessage.set('✏️ 成功更新工作日誌！');
          this.cancelEdit();
          setTimeout(() => this.toastMessage.set(''), 3000);
        },
        error: (err) => console.error('更新失敗：', err),
      });
    } else {
      // 💡 新增時寫入作者資訊
      const newLogData = {
        title: this.newTitle().trim(),
        category: this.newCategory(),
        hours: Number(this.newHours()) || 0,
        content: this.newContent().trim(),
        date: this.todayDate,
        username: currentUser?.username, // 寫入帳號
        authorName: currentUser?.name    // 寫入名稱
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

  startEdit(log: any) {
    const logDate = this.getLogDate(log);
    if (logDate !== this.todayDate) {
      this.warningMessage.set('⚠️ 僅能編輯當日的工作日誌，歷史紀錄無法修改！');
      this.showWarningModal.set(true);
      return;
    }
    this.viewMode.set('today');
    this.editingLogId.set(log.id);
    this.newTitle.set(log.title);
    this.newCategory.set(log.category);
    this.newHours.set(log.hours);
    this.newContent.set(log.content);
    this.showErrors.set(false);
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

  totalHours = computed(() => this.filteredLogs().reduce((sum, log) => sum + (Number(log.hours) || 0), 0));
  totalLogsCount = computed(() => this.filteredLogs().length);
  devCategoryHours = computed(() => this.filteredLogs().filter((log) => log.category === '開發').reduce((sum, log) => sum + (Number(log.hours) || 0), 0));

  filterStatusText = computed(() => {
    const start = this.startDateFilter();
    const end = this.endDateFilter();
    if (start && end) return `目前顯示：${start} ～ ${end}`;
    if (start) return `目前顯示：${start} 之後`;
    if (end) return `目前顯示：${end} 之前`;
    return '目前顯示：全部歷史紀錄';
  });
}