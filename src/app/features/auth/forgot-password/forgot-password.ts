import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { ApiErrorService } from '../../../core/services/api-error.service';
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

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
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
            this.serverError.set(this.apiError.resolveFromResponse(res, 'forgotPassword.error'));
            return;
          }
          this.router.navigate(['/forgot-password-sent'], {
            queryParams: { email }
          });
        },
        error: (err: HttpErrorResponse) => {
          this.serverError.set(this.apiError.resolve(err, 'forgotPassword.error'));
        }
      });
  }
}
