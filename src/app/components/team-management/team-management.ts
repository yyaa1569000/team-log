import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TeamService, TeamMember } from '../../services/team';

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [FormsModule], // 💡 引入 FormsModule 處理雙向綁定 [(ngModel)]
  templateUrl: './team-management.html',
  styleUrl: './team-management.css',
})
export class TeamManagement implements OnInit {
  teamService = inject(TeamService);

  // 控制新增成員 Modal 彈窗開關
  isModalOpen = signal(false);

  // 新增成員的表單暫存狀態
  newName = signal('');
  newRole = signal('前端工程師');
  newStatus = signal('線上');

  ngOnInit() {
    this.teamService.fetchMembers(); // 頁面載入時向後端請求資料
  }

  // 開關 Modal
  openModal() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.resetForm();
  }

  resetForm() {
    this.newName.set('');
    this.newRole.set('前端工程師');
    this.newStatus.set('線上');
  }

  // 觸發新增動作
  handleAddMember() {
    if (!this.newName().trim()) return;

    const newMember: TeamMember = {
      name: this.newName().trim(),
      role: this.newRole(),
      status: this.newStatus(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(this.newName())}`,
    };

    this.teamService.addMember(newMember);
    this.closeModal();
  }

  // 觸發刪除動作
  handleDeleteMember(id?: number) {
    if (!id) return;
    if (confirm('確定要刪除該團隊成員嗎？')) {
      this.teamService.deleteMember(id);
    }
  }
}