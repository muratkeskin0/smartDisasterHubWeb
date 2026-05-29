import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { TranslocoPipe } from '@jsverse/transloco';
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
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslocoPipe, LanguageSwitcherComponent, AppLogoComponent],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private apiError = inject(ApiErrorService);
  private router = inject(Router);

  registerForm: FormGroup;
  loading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  errors = signal<{ [key: string]: string }>({});
  serverError = signal('');

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });
  }

  togglePassword(): void {
    this.showPassword.update(value => !value);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(value => !value);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.serverError.set('');
    this.loading.set(true);

    const { confirmPassword, ...registerData } = this.registerForm.value;

    this.authService.register(registerData)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.serverError.set(this.apiError.resolveFromResponse(response, 'errors.auth.registerFailed'));
            return;
          }

          const email = response.data?.activationSentTo || registerData.email;
          this.router.navigate(['/activation-mail-sent'], { queryParams: { email } });
        },
        error: (err: HttpErrorResponse) => {
          this.serverError.set(this.apiError.resolve(err, 'errors.auth.registerFailed'));
        }
      });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return this.requiredMessage(fieldName);
      }
      if (control.errors['email']) {
        return this.apiError.translate('errors.validationFields.emailInvalid');
      }
      if (control.errors['minlength']) {
        return this.apiError.translate('errors.validationFields.passwordMinLength');
      }
      if (control.errors['maxlength']) {
        return this.apiError.translate('errors.validation');
      }
    }
    if (this.registerForm.errors?.['passwordMismatch'] && fieldName === 'confirmPassword') {
      return this.apiError.translate('errors.validationFields.passwordMismatch');
    }
    return '';
  }

  private requiredMessage(fieldName: string): string {
    const keys: Record<string, string> = {
      firstName: 'errors.validationFields.firstNameRequired',
      lastName: 'errors.validationFields.lastNameRequired',
      email: 'errors.validationFields.emailRequired',
      password: 'errors.validationFields.passwordRequired',
      confirmPassword: 'errors.validationFields.confirmPasswordRequired'
    };
    return this.apiError.translate(keys[fieldName] ?? 'errors.validation');
  }
}
