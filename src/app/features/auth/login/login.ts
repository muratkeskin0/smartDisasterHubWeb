import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { TranslocoPipe } from '@jsverse/transloco';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher';
import { AppLogoComponent } from '../../../shared/components/app-logo/app-logo';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslocoPipe, LanguageSwitcherComponent, AppLogoComponent],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private apiError = inject(ApiErrorService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  loading = signal(false);
  showPassword = signal(false);
  errors = signal<{ email?: string; password?: string }>({});
  serverError = signal('');
  successMessage = signal('');

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    if (this.route.snapshot.queryParamMap.get('passwordReset') === '1') {
      this.successMessage.set(this.apiError.translate('resetPasswordPage.loginHint'));
    }
  }

  togglePassword(): void {
    this.showPassword.update(value => !value);
  }

  validateEmail(): void {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.errors?.['required']) {
      this.errors.update(e => ({ ...e, email: this.apiError.translate('errors.validationFields.emailRequired') }));
    } else if (emailControl?.errors?.['email']) {
      this.errors.update(e => ({ ...e, email: this.apiError.translate('errors.validationFields.emailInvalid') }));
    } else {
      this.errors.update(e => ({ ...e, email: undefined }));
    }
  }

  validateForm(): boolean {
    this.errors.set({});
    let isValid = true;

    if (this.loginForm.get('email')?.invalid) {
      this.validateEmail();
      isValid = false;
    }

    if (this.loginForm.get('password')?.invalid) {
      const passwordControl = this.loginForm.get('password');
      if (passwordControl?.errors?.['required']) {
        this.errors.update(e => ({ ...e, password: this.apiError.translate('errors.validationFields.passwordRequired') }));
      } else if (passwordControl?.errors?.['minlength']) {
        this.errors.update(e => ({ ...e, password: this.apiError.translate('errors.validationFields.passwordMinLength') }));
      }
      isValid = false;
    }

    return isValid;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading.set(true);
    this.serverError.set('');

    this.authService.login(this.loginForm.value)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data?.token) {
            this.serverError.set(this.apiError.resolveFromResponse(response, 'errors.auth.loginFailed'));
            return;
          }

          const returnUrl = this.route.snapshot.queryParams['returnUrl'];
          if (this.authService.isStaff) {
            const target = returnUrl && returnUrl !== '/' ? returnUrl : this.authService.defaultHomeRoute;
            this.router.navigateByUrl(target);
          } else if (returnUrl && returnUrl.startsWith('/about')) {
            this.router.navigateByUrl(returnUrl);
          } else {
            this.router.navigate([this.authService.defaultHomeRoute]);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.serverError.set(this.apiError.resolve(err, 'errors.auth.loginFailed'));
        }
      });
  }
}
