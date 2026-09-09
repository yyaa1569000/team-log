import { Component, inject } from '@angular/core';
import { TeamService } from '../../services/team';

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [],
  templateUrl: './team-management.html',
  styleUrl: './team-management.css'
})
export class TeamManagement {
  teamService = inject(TeamService);
}