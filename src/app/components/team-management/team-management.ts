import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService, User } from '../../services/team';
import { AuthService } from '../../services/auth.service';
import { TutorialService } from '../../services/tutorial.service'; // 👉 引入 TutorialService

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-management.html',
  styleUrls: ['./team-management.css']
})
export class TeamManagementComponent implements OnInit {
  teamService = inject(TeamService);
  authService = inject(AuthService);
  tutorialService = inject(TutorialService); // 👉 注入 TutorialService

  isModalOpen = signal(false);
  newMemberName = signal('');
  newMemberUsername = signal('');

  isDeleteModalOpen = signal(false);
  userToDelete = signal<User | null>(null);

  isAdmin = computed(() => this.authService.currentUser()?.role === 'ADMIN');
  copiedUserId = signal<number | null>(null);

  // 👇 團隊頁面的導覽步驟
  tourSteps = [
    { 
      id: 'tour-add-member', 
      title: '✨ 團隊成員管理', 
      content: '點擊此按鈕可以新增團隊成員（如面試官或測試人員），系統會自動賦予預設密碼與一般成員權限。', 
      position: 'bottom',
      action: () => {} 
    }
  ];
  currentTourStep = signal(0);
  tooltipPos = signal({ top: 0, left: 0 });

  constructor() {
    effect(() => {
      if (this.tutorialService.isActive()) {
        setTimeout(() => this.updateTourPosition(), 50); 
      } else {
        this.clearHighlight();
      }
    });
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

  copyPassword(user: User, event: Event) {
    event.stopPropagation();
    const pwd = user.password || '123456';

    navigator.clipboard.writeText(pwd).then(() => {
      if (user.id) {
        this.copiedUserId.set(user.id);
        setTimeout(() => {
          if (this.copiedUserId() === user.id) {
            this.copiedUserId.set(null);
          }
        }, 1500);
      }
    });
  }

  ngOnInit() {
    this.teamService.fetchUsers();

    // 只要總開關是開的，進入團隊頁面也會自動啟動教學
    if (this.tutorialService.isTutorialEnabled() && this.isAdmin()) {
      setTimeout(() => {
        this.currentTourStep.set(0);
        this.tutorialService.startTutorial();
      }, 300);
    }
  }

  openModal() {
    this.newMemberName.set('');
    this.newMemberUsername.set('');
    this.isModalOpen.set(true);
    this.teamService.fetchUsers();
    if (!this.isAdmin()) return;
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  submitAddMember() {
    const name = this.newMemberName().trim();
    const username = this.newMemberUsername().trim();

    if (name) {
      this.teamService.addUser({ name, username: username || undefined });
      this.closeModal();
    }
  }

  openDeleteModal(user: User) {
    this.userToDelete.set(user);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.userToDelete.set(null);
  }

  confirmDeleteMember() {
    const user = this.userToDelete();
    if (user && user.id) {
      this.teamService.deleteUser(user.id, () => {
        this.closeDeleteModal();
      });
    }
  }
}