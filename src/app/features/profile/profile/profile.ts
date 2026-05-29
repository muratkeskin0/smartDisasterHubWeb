import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../models';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { AppTipComponent } from '../../../shared/components/app-tip/app-tip';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AppHeaderComponent,
    BackButtonComponent,
    TranslocoPipe,
    AppTipComponent
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private transloco = inject(TranslocoService);
  private fb = inject(FormBuilder);

  currentUser$ = this.authService.currentUser$;
  userFullName = computed(() => this.authService.userFullName);

  editing = signal(false);
  loading = signal(false);
  saving = signal(false);
  cancellingPendingEmail = signal(false);
  loadError = signal<string | null>(null);
  saveError = signal<string | null>(null);
  saveSuccessKey = signal<string | null>(null);
  saveSuccessParams = signal<Record<string, string>>({});

  profileForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]]
  });

  get userInitials(): string {
    const user = this.authService.currentUserValue;
    if (!user) return '?';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  get user() {
    return this.authService.currentUserValue;
  }

  get roleClass(): string {
    if (this.authService.isAdmin) return 'role-admin';
    if (this.authService.isManager) return 'role-manager';
    return 'role-basic';
  }

  get backFallback(): string {
    return this.authService.defaultHomeRoute;
  }

  ngOnInit(): void {
    this.refreshProfile();
  }

  refreshProfile(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.authService.getProfile().subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.patchForm(res.data);
        }
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('profile.loadError');
        const u = this.authService.currentUserValue;
        if (u) this.patchForm(u);
      }
    });
  }

  startEdit(): void {
    const u = this.authService.currentUserValue;
    if (u) this.patchForm(u, true);
    this.editing.set(true);
    this.saveError.set(null);
    this.saveSuccessKey.set(null);
  }

  cancelPendingEmailChange(): void {
    if (!this.hasPendingEmailChange || this.cancellingPendingEmail()) return;
    this.cancellingPendingEmail.set(true);
    this.saveError.set(null);
    this.authService
      .cancelPendingEmailChange()
      .pipe(finalize(() => this.cancellingPendingEmail.set(false)))
      .subscribe({
        next: res => {
          if (res.success && res.data) {
            this.patchForm(res.data);
            this.saveSuccessKey.set('profile.emailChangeCancelled');
            this.saveSuccessParams.set({});
          } else {
            this.saveError.set('profile.cancelEmailChangeFailed');
          }
        },
        error: () => this.saveError.set('profile.cancelEmailChangeFailed')
      });
  }

  cancelEdit(): void {
    const u = this.authService.currentUserValue;
    if (u) this.patchForm(u);
    this.editing.set(false);
    this.saveError.set(null);
    this.profileForm.markAsPristine();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);
    this.saveSuccessKey.set(null);

    const { firstName, lastName, email } = this.profileForm.getRawValue();
    this.authService
      .updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: res => {
          if (res.success && res.data) {
            this.editing.set(false);
            this.patchForm(res.data);
            if (res.data.emailChangePending && res.data.pendingEmail) {
              this.saveSuccessKey.set('profile.emailChangePending');
              this.saveSuccessParams.set({ email: res.data.pendingEmail });
            } else {
              this.saveSuccessKey.set('profile.saveSuccess');
              this.saveSuccessParams.set({});
            }
            this.profileForm.markAsPristine();
          } else {
            this.saveError.set('profile.saveError');
          }
        },
        error: (err: HttpErrorResponse) => {
          const code = err.error?.error?.code;
          const msg = err.error?.error?.details || err.error?.message;
          if (code === 'EMAIL_ALREADY_EXISTS' || (typeof msg === 'string' && msg.toLowerCase().includes('email'))) {
            this.saveError.set('profile.emailTaken');
          } else {
            this.saveError.set('profile.saveError');
          }
        }
      });
  }

  private patchForm(u: User, preferPendingInEmailField = false): void {
    const emailForField =
      preferPendingInEmailField && u.emailChangePending && u.pendingEmail ? u.pendingEmail : u.email;
    this.profileForm.patchValue({
      firstName: u.firstName,
      lastName: u.lastName,
      email: emailForField
    });
  }

  get hasPendingEmailChange(): boolean {
    return !!this.user?.emailChangePending && !!this.user?.pendingEmail;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const locale = this.transloco.getActiveLang() === 'tr' ? 'tr-TR' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  fieldError(field: string): string | null {
    const c = this.profileForm.get(field);
    if (!c || !c.touched || !c.errors) return null;
    if (c.errors['required']) return 'profile.validationRequired';
    if (c.errors['email']) return 'profile.validationEmail';
    if (c.errors['minlength']) return 'profile.validationMinLength';
    return 'profile.validationInvalid';
  }
}
