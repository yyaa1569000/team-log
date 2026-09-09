import { Injectable, signal, computed } from '@angular/core';

export interface WorkLog {
  id: number;
  title: string;
  content: string;
  category: string;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private logsSignal = signal<WorkLog[]>([
    { id: 1, title: '完成登入與路由架構', content: '使用 Angular 獨立元件實作了登入頁與儀表板的切換。', category: '開發', date: '2026-06-07' },
    { id: 2, title: '檢視團隊協作進度', content: '與團隊成員確認本週的 Sprint 目標與待辦清單。', category: '會議', date: '2026-06-07' },
    { id: 3, title: '修復表單驗證問題', content: '調整了登入按鈕的事件綁定與表單送出邏輯。', category: '測試', date: '2026-06-08' }
  ]);

  // 搜尋與篩選條件的訊號 (Signals)
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('全部');

  logs = this.logsSignal.asReadonly();

  // 計算屬性：根據搜尋關鍵字與分類自動過濾日誌
  filteredLogs = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();

    return this.logsSignal().filter(log => {
      const matchesCategory = category === '全部' || log.category === category;
      const matchesQuery = log.title.toLowerCase().includes(query) || 
                           log.content.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  });

  addLog(log: Omit<WorkLog, 'id'>) {
    const newLog = { ...log, id: Date.now() };
    this.logsSignal.update(currentLogs => [newLog, ...currentLogs]);
  }
}