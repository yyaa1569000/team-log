import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LogService } from '../../services/log';

@Component({
  selector: 'app-log-management',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './log-management.html',
  styleUrl: './log-management.css'
})
export class LogManagement {
  logService = inject(LogService);

  title = '';
  content = '';
  category = '開發';

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.title.trim() || !this.content.trim()) return;

    const today = new Date().toISOString().split('T')[0];
    this.logService.addLog({
      title: this.title,
      content: this.content,
      category: this.category,
      date: today
    });

    this.title = '';
    this.content = '';
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.logService.searchQuery.set(value);
  }

  setCategory(category: string) {
    this.logService.selectedCategory.set(category);
  }
}