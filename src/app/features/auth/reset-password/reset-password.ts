import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher';
import { AppLogoComponent } from '../../../shared/components/app-logo/app-logo';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    TranslocoPipe,
    LanguageSwitcherComponent,
    AppLogoComponent
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private apiError = inject(ApiErrorService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  form: FormGroup;
  token = '';
  loading = signal(true);
  saving = signal(false);
  tokenValid = signal(false);
  success = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor() {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: passwordMatchValidator }
    );

    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.loading.set(false);
      this.errorMessage.set(this.apiError.translate('resetPassword.invalidLink'));
      return;
    }

    this.authService.validateResetPasswordToken(this.token).subscribe({
      next: res => {
        this.loading.set(false);
        if (!res.success) {
          this.errorMessage.set(this.apiError.resolveFromResponse(res, 'resetPassword.invalidLink'));
          return;
        }
        this.tokenValid.set(true);
      },
      error: err => {
        this.loading.set(false);
        this.errorMessage.set(this.apiError.resolve(err, 'resetPassword.invalidLink'));
      }
    });
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }

  onSubmit(): void {
    if (!this.tokenValid() || this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const password = this.form.get('password')?.value ?? '';
    const confirmPassword = this.form.get('confirmPassword')?.value ?? '';

    this.authService
      .resetPassword(this.token, password, confirmPassword)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: res => {
          if (!res.success) {
            this.errorMessage.set(this.apiError.resolveFromResponse(res, 'resetPassword.error'));
            return;
          }
          this.success.set(true);
          this.successMessage.set(
            res.message || this.apiError.translate('resetPassword.successBody')
          );
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(this.apiError.resolve(err, 'resetPassword.error'));
        }
      });
  }

  goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { passwordReset: '1' } });
  }
}
