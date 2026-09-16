import { Component, OnInit, inject, signal, computed} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService, User } from '../../services/team';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-management.html',
  styleUrls: ['./team-management.css']
})
export class TeamManagementComponent implements OnInit {
  teamService = inject(TeamService);
  isModalOpen = signal(false);
  newMemberName = signal('');
  newMemberUsername = signal('');
  authService = inject(AuthService);

  isDeleteModalOpen = signal(false);
  userToDelete = signal<User | null>(null);

  // 判斷目前登入使用者是否具有 ADMIN 權限
  isAdmin = computed(() => this.authService.currentUser()?.role === 'ADMIN');


  ngOnInit() {
    this.teamService.fetchUsers();
  }

  openModal() {
    this.newMemberName.set('');
    this.newMemberUsername.set('');
    this.isModalOpen.set(true);
    this.teamService.fetchUsers();
    if (!this.isAdmin()) return; // 雙重防護
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