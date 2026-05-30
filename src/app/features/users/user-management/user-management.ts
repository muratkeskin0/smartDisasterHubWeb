import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { AppTipComponent } from '../../../shared/components/app-tip/app-tip';
import { UserAdminService, UserUpdateRequest } from '../../../core/services/user-admin.service';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole } from '../../../models';

type StatusFilter = 'all' | 'pending' | 'verified';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslocoPipe,
    AppHeaderComponent,
    BackButtonComponent,
    AppTipComponent
  ],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagementComponent implements OnInit {
  private userAdmin = inject(UserAdminService);
  private apiError = inject(ApiErrorService);
  private auth = inject(AuthService);

  users: User[] = [];
  roles: UserRole[] = [];
  loading = true;
  actionLoadingId: number | null = null;
  error: string | null = null;
  success: string | null = null;

  searchTerm = '';
  statusFilter: StatusFilter = 'all';

  editingUser: User | null = null;
  editForm = {
    firstName: '',
    lastName: '',
    email: '',
    roleId: 0,
    isEmailVerified: false
  };
  savingEdit = false;

  deleteTarget: User | null = null;
  deleting = false;

  currentUserId = computed(() => this.auth.currentUserValue?.id ?? null);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    this.userAdmin.listUsers().subscribe({
      next: res => {
        this.users = res.success && res.data ? res.data : [];
        this.loading = false;
      },
      error: err => {
        this.error = this.apiError.resolve(err, 'userManagement.loadError');
        this.loading = false;
      }
    });

    this.userAdmin.listRoles().subscribe({
      next: res => {
        this.roles =
          res.success && res.data ? res.data.filter(r => r.name !== 'ADMIN') : [];
      }
    });
  }

  get filteredUsers(): User[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.users
      .filter(u => {
        if (this.statusFilter === 'pending') {
          return !u.isEmailVerified;
        }
        if (this.statusFilter === 'verified') {
          return u.isEmailVerified;
        }
        return true;
      })
      .filter(u => {
        if (!term) {
          return true;
        }
        const haystack = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      });
  }

  getInitials(user: User): string {
    const a = (user.firstName?.trim()[0] ?? '').toUpperCase();
    const b = (user.lastName?.trim()[0] ?? '').toUpperCase();
    return (a + b) || '?';
  }

  roleLabel(user: User): string {
    return user.role?.name ?? '—';
  }

  canDelete(user: User): boolean {
    if (user.role?.name === 'ADMIN') {
      return false;
    }
    return user.id !== this.currentUserId();
  }

  canResend(user: User): boolean {
    return !user.isEmailVerified && user.role?.name === 'BASIC';
  }

  openEdit(user: User): void {
    this.editingUser = user;
    this.editForm = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: user.role?.id ?? 0,
      isEmailVerified: user.isEmailVerified
    };
    this.success = null;
    this.error = null;
  }

  closeEdit(): void {
    this.editingUser = null;
    this.savingEdit = false;
  }

  saveEdit(): void {
    if (!this.editingUser || this.savingEdit) {
      return;
    }

    this.savingEdit = true;
    this.error = null;
    this.success = null;

    const body: UserUpdateRequest = {
      firstName: this.editForm.firstName.trim(),
      lastName: this.editForm.lastName.trim(),
      email: this.editForm.email.trim(),
      isEmailVerified: this.editForm.isEmailVerified
    };

    if (this.editingUser.role?.name !== 'ADMIN') {
      body.roleId = this.editForm.roleId;
    }

    this.userAdmin.updateUser(this.editingUser.id, body).subscribe({
      next: res => {
        this.savingEdit = false;
        if (res.success) {
          this.success = 'userManagement.updateSuccess';
          this.closeEdit();
          this.loadData();
        } else {
          this.error = this.apiError.resolveFromResponse(res, 'userManagement.updateError');
        }
      },
      error: err => {
        this.savingEdit = false;
        this.error = this.apiError.resolve(err, 'userManagement.updateError');
      }
    });
  }

  confirmDelete(user: User): void {
    this.deleteTarget = user;
    this.success = null;
    this.error = null;
  }

  cancelDelete(): void {
    this.deleteTarget = null;
    this.deleting = false;
  }

  deleteUser(): void {
    if (!this.deleteTarget || this.deleting) {
      return;
    }

    this.deleting = true;
    this.error = null;
    this.success = null;

    this.userAdmin.deleteUser(this.deleteTarget.id).subscribe({
      next: res => {
        this.deleting = false;
        if (res.success) {
          this.success = 'userManagement.deleteSuccess';
          this.cancelDelete();
          this.loadData();
        } else {
          this.error = this.apiError.resolveFromResponse(res, 'userManagement.deleteError');
        }
      },
      error: err => {
        this.deleting = false;
        this.error = this.apiError.resolve(err, 'userManagement.deleteError');
      }
    });
  }

  resendActivation(user: User): void {
    if (this.actionLoadingId != null) {
      return;
    }

    this.actionLoadingId = user.id;
    this.error = null;
    this.success = null;

    this.userAdmin.resendActivation(user.id).subscribe({
      next: res => {
        this.actionLoadingId = null;
        if (res.success) {
          this.success = 'userManagement.resendSuccess';
        } else {
          this.error = this.apiError.resolveFromResponse(res, 'userManagement.resendError');
        }
      },
      error: err => {
        this.actionLoadingId = null;
        this.error = this.apiError.resolve(err, 'userManagement.resendError');
      }
    });
  }

  formatDate(value: string): string {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
