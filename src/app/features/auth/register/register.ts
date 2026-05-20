import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
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
      .pipe(
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          const email = response.data?.activationSentTo || registerData.email;
          this.router.navigate(['/activation-mail-sent'], { queryParams: { email } });
        },
        error: (err: HttpErrorResponse) => {
          console.error('Register error:', err);
          this.serverError.set(this.extractErrorMessage(err));
        }
      });
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const backendMessage = error?.error?.message;
    const backendDetails = error?.error?.error?.details;

    if (typeof backendMessage === 'string' && backendMessage.trim()) {
      return backendMessage;
    }

    if (typeof backendDetails === 'string' && backendDetails.trim()) {
      return backendDetails;
    }

    if (error.status === 409) {
      return 'This email is already registered.';
    }

    if (!error.status) {
      return 'Network error. Please check your connection.';
    }

    return 'Registration failed. Please try again.';
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
      if (control.errors['required']) return `${fieldName} is required`;
      if (control.errors['email']) return 'Please enter a valid email address';
      if (control.errors['minlength']) return `${fieldName} must be at least ${control.errors['minlength'].requiredLength} characters`;
      if (control.errors['maxlength']) return `${fieldName} must be at most ${control.errors['maxlength'].requiredLength} characters`;
    }
    if (this.registerForm.errors?.['passwordMismatch'] && fieldName === 'confirmPassword') {
      return 'Passwords do not match';
    }
    return '';
  }
}
