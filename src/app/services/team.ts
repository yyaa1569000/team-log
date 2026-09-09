import { Injectable, signal } from '@angular/core';

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  status: 'online' | 'busy' | 'offline';
  avatar: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private membersSignal = signal<TeamMember[]>([
    { id: 1, name: '王小明', role: '前端工程師', status: 'online', avatar: '👨‍💻' },
    { id: 2, name: '李大華', role: '後端架構師', status: 'busy', avatar: '⚙️' },
    { id: 3, name: '張美玲', role: 'UI/UX 設計師', status: 'offline', avatar: '🎨' },
    { id: 4, name: '陳志豪', role: '專案經理', status: 'online', avatar: '📊' }
  ]);

  members = this.membersSignal.asReadonly();
}