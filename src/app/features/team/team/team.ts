import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { AppTipComponent } from '../../../shared/components/app-tip/app-tip';
import { UserAdminService } from '../../../core/services/user-admin.service';
import { User } from '../../../models';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslocoPipe, AppHeaderComponent, BackButtonComponent, AppTipComponent],
  templateUrl: './team.html',
  styleUrl: './team.css'
})
export class TeamComponent implements OnInit {
  private userAdmin = inject(UserAdminService);

  managers: User[] = [];
  loading = true;
  saving = false;
  error: string | null = null;
  success: string | null = null;

  form = {
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  };

  ngOnInit(): void {
    this.loadManagers();
  }

  loadManagers(): void {
    this.loading = true;
    this.error = null;
    this.userAdmin.listManagers().subscribe({
      next: res => {
        this.managers = res.success && res.data ? res.data : [];
        this.loading = false;
      },
      error: () => {
        this.error = 'team.loadError';
        this.loading = false;
      }
    });
  }

  getInitials(m: User): string {
    const a = (m.firstName?.trim()[0] ?? '').toUpperCase();
    const b = (m.lastName?.trim()[0] ?? '').toUpperCase();
    return (a + b) || '?';
  }

  createManager(): void {
    if (this.saving) return;
    this.saving = true;
    this.error = null;
    this.success = null;
    this.userAdmin.createManager({ ...this.form }).subscribe({
      next: res => {
        this.saving = false;
        if (res.success) {
          this.success = 'team.createSuccess';
          this.form = { firstName: '', lastName: '', email: '', password: '' };
          this.loadManagers();
        } else {
          this.error = 'team.createError';
        }
      },
      error: () => {
        this.saving = false;
        this.error = 'team.createError';
      }
    });
  }
}
