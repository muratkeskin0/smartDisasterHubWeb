import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { TranslocoPipe } from '@jsverse/transloco';
import { ApiResponse } from '../../../models';
import { AuthService } from '../../../core/services/auth.service';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { parseApiError } from '../../../core/utils/api-error.util';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher';
import { AppLogoComponent } from '../../../shared/components/app-logo/app-logo';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    TranslocoPipe,
    LanguageSwitcherComponent,
    AppLogoComponent
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private apiError = inject(ApiErrorService);
  private router = inject(Router);

  form: FormGroup;
  loading = signal(false);
  serverError = signal('');
  emailError = signal('');

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  validateEmail(): void {
    const emailControl = this.form.get('email');
    if (emailControl?.errors?.['required']) {
      this.emailError.set(this.apiError.translate('errors.validationFields.emailRequired'));
    } else if (emailControl?.errors?.['email']) {
      this.emailError.set(this.apiError.translate('errors.validationFields.emailInvalid'));
    } else {
      this.emailError.set('');
    }
  }

  onSubmit(): void {
    this.validateEmail();
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.serverError.set('');

    const email = this.form.get('email')?.value?.trim() ?? '';

    this.authService
      .forgotPassword(email)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => {
          if (!res.success) {
            this.serverError.set(this.resolveForgotResponse(res));
            return;
          }
          this.router.navigate(['/forgot-password-sent'], {
            queryParams: { email }
          });
        },
        error: (err: HttpErrorResponse) => {
          this.serverError.set(this.resolveForgotError(err));
        }
      });
  }

  private resolveForgotError(err: HttpErrorResponse): string {
    const parsed = parseApiError(err);
    if (parsed.code === 'USER_001') {
      return this.apiError.translate('forgotPasswordPage.userNotFound');
    }
    return this.apiError.resolve(err, 'forgotPasswordPage.error');
  }

  private resolveForgotResponse(res: ApiResponse<void>): string {
    if (res.error?.code === 'USER_001') {
      return this.apiError.translate('forgotPasswordPage.userNotFound');
    }
    return this.apiError.resolveFromResponse(res, 'forgotPasswordPage.error');
  }
}
