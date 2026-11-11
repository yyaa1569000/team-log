import { Component, OnInit, inject, signal, computed, HostListener, effect, Directive, ElementRef, AfterViewInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogService } from '../../services/log';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs'; 
import { LoadingService } from '../../loading.service';
import { TutorialService } from '../../services/tutorial.service'; 

// 👇 終極版：自動偵測文字溢出的 Directive 👇
@Directive({
  selector: '[appOverflowCheck]',
  standalone: true
})
export class OverflowCheckDirective implements AfterViewInit, OnDestroy {
  @Output() hasOverflow = new EventEmitter<boolean>();
  private observer!: ResizeObserver;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    // 使用現代瀏覽器原生的 ResizeObserver，只要元素大小、內容或排版一改變，就會自動觸發！絕對精準。
    this.observer = new ResizeObserver(() => {
      this.checkOverflow();
    });
    this.observer.observe(this.el.nativeElement);
    
    // 初始強制檢查一次 (給一點延遲確保資料已綁定)
    setTimeout(() => this.checkOverflow(), 200);
  }

  private checkOverflow() {
    const el = this.el.nativeElement;
    // 判斷：實際內容高度 > 可視高度 (加 2px 容錯，避免小數點運算誤差)
    const isOverflowing = el.scrollHeight > (el.clientHeight + 2);
    
    // 💡 使用 Promise.resolve().then() 避免 Angular 報錯 "ExpressionChangedAfterItHasBeenCheckedError"
    Promise.resolve().then(() => {
      this.hasOverflow.emit(isOverflowing);
    });
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
// 👆 Directive 宣告結束 👆


@Component({
  selector: 'app-log-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent, OverflowCheckDirective],
  templateUrl: './log-management.html',
  styleUrls: ['./log-management.css'],
})
export class LogManagement implements OnInit {
  logService = inject(LogService);
  authService = inject(AuthService);
  loadingService = inject(LoadingService);
  tutorialService = inject(TutorialService); 

  newTitle = signal('');
  newCategory = signal('開發');
  newHours = signal<number | string>(1);
  newContent = signal('');
  showErrors = signal(false);
  toastMessage = signal('');

  isSubmitting = signal(false);
  isGeneratingSummary = signal(false); 

  selectedLogIds = signal<Set<number>>(new Set());
  deleteMode = signal<'single' | 'batch' | 'all' | null>(null);

  searchQuery = signal('');
  selectedCategory = signal('全部');
  selectedUser = signal('全部');

  showDeleteModal = signal(false);
  deletingLogId = signal<number | null>(null);

  dailyAiSummary = signal<string | null>(null);

  // 控制彈出詳細視窗
  selectedLogForModal = signal<any | null>(null);

  // 紀錄每一張卡片是否發生文字溢出
  overflowMap = signal<{ [key: number]: boolean }>({});

  onOverflowStatusChange(id: number, status: boolean) {
    this.overflowMap.update(map => ({ ...map, [id]: status }));
  }

  tourSteps = [
    { 
      id: 'tour-tab-today', 
      title: '✨ 1. 今日工作填寫', 
      content: '點擊此頁籤，可以切換到「今日模式」，在這裡填寫您今天最新的工作日誌。', 
      position: 'bottom',
      action: () => this.viewMode.set('today') 
    },
    { 
      id: 'tour-tab-history', 
      title: '✨ 2. 歷史紀錄查詢', 
      content: '點擊此頁籤，可以切換到「歷史模式」，利用日期篩選器來查詢過去所有的歷史紀錄。', 
      position: 'bottom',
      action: () => this.viewMode.set('history') 
    },
    { 
      id: 'tour-submit', 
      title: '✨ 3. 提交日誌', 
      content: '在今日模式下填寫完標題、工時與內容後，點擊「提交日誌」按鈕即可送出。', 
      position: 'top',
      action: () => this.viewMode.set('today') 
    },
    { 
      id: 'tour-batch', 
      title: '✨ 4. AI 智慧總結', 
      content: '【請先勾選項目】：想產生總結時，請先在下方列表勾選特定日誌（打勾），接著點擊此按鈕，AI 就會幫你把勾選的項目匯整成一份精美報告！', 
      position: 'top', 
      action: () => this.viewMode.set('today') 
    }
  ];
  
  currentTourStep = signal(0);
  tooltipPos = signal({ top: 0, left: 0 });

  deleteModalTitle = computed(() => {
    const mode = this.deleteMode();
    if (mode === 'batch') return `確認刪除這 ${this.selectedLogIds().size} 筆日誌？`;
    if (mode === 'all') return `⚠️ 警告：確認清空目前顯示的 ${this.filteredLogs().length} 筆日誌？`;
    return '確認刪除這筆日誌？';
  });

  deleteModalMessage = computed(() => {
    const mode = this.deleteMode();
    if (mode === 'all') return '此操作將會清空目前篩選出的所有日誌，刪除後資料將無法復原，您確定要繼續嗎？';
    return '刪除後資料將無法復原，您確定要繼續嗎？';
  });

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

  uniqueUsers = computed(() => {
    const logs = this.logService.logs();
    const users = logs.map((l) => l.authorName).filter(Boolean);
    return [...new Set(users)];
  });

  isSingleDateSelected = computed(() => {
    if (this.viewMode() === 'today') return true;
    const start = this.startDateFilter();
    const end = this.endDateFilter();
    return start && end && start === end;
  });

  constructor() {
    effect(() => {
      if (this.tutorialService.isActive()) {
        const step = this.tourSteps[this.currentTourStep()];
        if (step.action) step.action(); 
        setTimeout(() => this.updateTourPosition(), 30); 
      } else {
        this.clearHighlight();
      }
    });
  }

  openLogDetail(log: any) {
    this.selectedLogForModal.set(log);
  }

  closeLogDetail() {
    this.selectedLogForModal.set(null);
  }

  updateTourPosition() {
    this.clearHighlight();
    const step = this.tourSteps[this.currentTourStep()];
    const targetEl = document.getElementById(step.id);
    
    if (targetEl) {
      targetEl.classList.add('tour-highlight-active');
      targetEl.scrollIntoView({ block: 'center' });

      const targetRect = targetEl.getBoundingClientRect();
      const tooltipEl = document.querySelector('.tour-tooltip') as HTMLElement;
      const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 300; 
      const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 200; 

      const targetCenterX = targetRect.left + (targetRect.width / 2);
      let left = targetCenterX - (tooltipWidth / 2);
      
      if (left < 10) left = 10;
      const maxLeft = window.innerWidth - tooltipWidth - 10;
      if (left > maxLeft) left = maxLeft;

      let top = 0;
      if (step.position === 'bottom') {
        top = targetRect.bottom + 15; 
      } else if (step.position === 'top') {
        top = targetRect.top - tooltipHeight - 15; 
      }

      this.tooltipPos.set({ top, left });
    }
  }

  clearHighlight() {
    document.querySelectorAll('.tour-highlight-active').forEach(el => {
      el.classList.remove('tour-highlight-active');
    });
  }

  nextTourStep() {
    if (this.currentTourStep() < this.tourSteps.length - 1) {
      this.currentTourStep.set(this.currentTourStep() + 1);
    } else {
      this.tutorialService.stopTutorial();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.isSubmitting() || this.isGeneratingSummary()) {
      $event.returnValue = '正在與伺服器連線中，確定要離開嗎？';
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.updatePageSize();
    if (this.tutorialService.isActive()) {
       this.updateTourPosition();
    }
  }

  ngOnInit() {
    this.logService.fetchLogs();
    this.updatePageSize();

    if (this.tutorialService.isTutorialEnabled()) {
      setTimeout(() => {
        this.currentTourStep.set(0);
        this.tutorialService.startTutorial();
      }, 300);
    }
  }

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
    this.dailyAiSummary.set(null); 
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
    this.dailyAiSummary.set(null); 
  }

  closeWarningModal() {
    this.showWarningModal.set(false);
  }

  getLogDate(log: any): string {
    if (log.date) return log.date;
    if (log.createdAt) return String(log.createdAt).substring(0, 10);
    return '';
  }

  filteredLogs = computed(() => {
    const mode = this.viewMode();
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();
    const targetUser = this.selectedUser();
    const start = this.startDateFilter();
    const end = this.endDateFilter();
    const today = this.todayDate;
    const currentUser = this.authService.currentUser();

    return this.logService
      .logs()
      .filter((log) => {
        if (currentUser?.role !== 'ADMIN') {
          if (log.username !== currentUser?.username) return false;
        } else {
          if (targetUser !== '全部' && log.authorName !== targetUser) return false;
        }

        const logDateOnly = this.getLogDate(log);
        if (mode === 'today') {
          if (logDateOnly !== today) return false;
        } else {
          if (start && logDateOnly < start) return false;
          if (end && logDateOnly > end) return false;
        }

        const matchesCategory = category === '全部' || log.category === category;
        const matchesSearch =
          !query ||
          log.title.toLowerCase().includes(query) ||
          log.content.toLowerCase().includes(query) ||
          (log.authorName && log.authorName.toLowerCase().includes(query));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
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

  toggleSelection(id: number) {
    const current = new Set(this.selectedLogIds());
    if (current.has(id)) current.delete(id);
    else current.add(id);
    this.selectedLogIds.set(current);
  }

  selectAllCurrentPage() {
    const current = new Set(this.selectedLogIds());
    this.paginatedLogs().forEach((log) => current.add(log.id));
    this.selectedLogIds.set(current);
  }

  clearSelection() {
    this.selectedLogIds.set(new Set());
  }

  submitLog() {
    if (!this.newTitle().trim() || !this.newContent().trim() || !this.newHours()) {
      this.showErrors.set(true);
      return;
    }

    this.isSubmitting.set(true);
    this.loadingService.show('儲存中...'); 

    const editId = this.editingLogId();
    const currentUser = this.authService.currentUser();

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
          this.isSubmitting.set(false);
          this.toastMessage.set('✏️ 成功更新工作日誌！');
          this.cancelEdit();
          setTimeout(() => this.toastMessage.set(''), 3000);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('更新失敗：', err);
        },
      });
    } else {
      const newLogData = {
        title: this.newTitle().trim(),
        category: this.newCategory(),
        hours: Number(this.newHours()) || 0,
        content: this.newContent().trim(),
        date: this.todayDate,
        username: currentUser?.username,
        authorName: currentUser?.name,
      };

      this.logService.addLog(newLogData).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toastMessage.set('🎉 成功新增工作日誌！');
          this.cancelEdit();
          setTimeout(() => this.toastMessage.set(''), 3000);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('寫入失敗：', err);
        },
      });
    }
  }

  generateSummaryFromSelection() {
    let idsToSummarize: number[] = [];

    if (this.selectedLogIds().size > 0) {
      idsToSummarize = Array.from(this.selectedLogIds());
    } 
    else if (this.isSingleDateSelected() && this.filteredLogs().length > 0) {
      if (this.dailyAiSummary() && !confirm('要重新生成一份新的總結覆蓋原有的嗎？')) {
        return;
      }
      idsToSummarize = this.filteredLogs().map(l => l.id);
    } else {
      this.warningMessage.set('請先勾選要總結的日誌，或確保日期篩選範圍為單一日！');
      this.showWarningModal.set(true);
      return;
    }

    this.isGeneratingSummary.set(true);
    this.loadingService.show('🧠 AI 智慧總結生成中... (約 5~15 秒，請勿關閉視窗)');

    this.logService.generateBatchSummary(idsToSummarize).subscribe({
      next: (res) => {
        this.dailyAiSummary.set(res.summary);
        this.isGeneratingSummary.set(false);
        this.clearSelection(); 
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
        this.toastMessage.set('✨ AI 總結生成完畢！');
        setTimeout(() => this.toastMessage.set(''), 3000);
      },
      error: (err) => {
        this.isGeneratingSummary.set(false);
        console.error('產生摘要失敗：', err);
        this.warningMessage.set('產生摘要失敗，請稍後再試。');
        this.showWarningModal.set(true);
      }
    });
  }

  copySummary() {
    const summary = this.dailyAiSummary();
    if (summary) {
      navigator.clipboard.writeText(summary).then(() => {
        this.toastMessage.set('📋 總結已複製到剪貼簿！');
        setTimeout(() => this.toastMessage.set(''), 2000);
      });
    }
  }

  openDeleteModal(id?: number) {
    if (!id) return;
    this.deletingLogId.set(id);
    this.deleteMode.set('single');
    this.showDeleteModal.set(true);
  }

  openBatchDeleteModal() {
    if (this.selectedLogIds().size === 0) return;
    this.deleteMode.set('batch');
    this.showDeleteModal.set(true);
  }

  openDeleteAllModal() {
    if (this.filteredLogs().length === 0) return;
    this.deleteMode.set('all');
    this.showDeleteModal.set(true);
  }

  handleConfirmDelete() {
    const mode = this.deleteMode();

    if (mode === 'single') {
      const id = this.deletingLogId();
      if (!id) return;
      this.logService.deleteLog(id).subscribe({
        next: () => this.finishDelete('🗑️ 已成功刪除日誌！'),
        error: (err) => {
          console.error('刪除失敗：', err);
          this.showDeleteModal.set(false);
        },
      });
    } else if (mode === 'batch') {
      const ids = Array.from(this.selectedLogIds());
      const requests = ids.map((id) => this.logService.deleteLog(id));
      forkJoin(requests).subscribe({
        next: () => this.finishDelete(`🗑️ 已成功刪除 ${ids.length} 筆日誌！`),
        error: (err) => {
          console.error('批次刪除失敗：', err);
          this.showDeleteModal.set(false);
        },
      });
    } else if (mode === 'all') {
      const ids = this.filteredLogs().map((l) => l.id);
      const requests = ids.map((id) => this.logService.deleteLog(id));
      forkJoin(requests).subscribe({
        next: () => this.finishDelete(`🗑️ 已成功清空 ${ids.length} 筆日誌！`),
        error: (err) => {
          console.error('全部刪除失敗：', err);
          this.showDeleteModal.set(false);
        },
      });
    }
  }

  finishDelete(msg: string) {
    this.toastMessage.set(msg);
    this.showDeleteModal.set(false);
    this.deletingLogId.set(null);
    this.deleteMode.set(null);
    this.selectedLogIds.set(new Set());
    this.logService.fetchLogs();
    setTimeout(() => this.toastMessage.set(''), 3000);
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