import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  loading = signal(false);
  showPassword = signal(false);
  errors = signal<{ email?: string; password?: string }>({});

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePassword(): void {
    this.showPassword.update(value => !value);
  }

  validateEmail(): void {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.errors?.['required']) {
      this.errors.update(e => ({ ...e, email: 'Email is required' }));
    } else if (emailControl?.errors?.['email']) {
      this.errors.update(e => ({ ...e, email: 'Please enter a valid email address' }));
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
        this.errors.update(e => ({ ...e, password: 'Password is required' }));
      } else if (passwordControl?.errors?.['minlength']) {
        this.errors.update(e => ({ ...e, password: 'Password must be at least 6 characters' }));
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

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigate([returnUrl]);
      },
      error: (err) => {
        console.error('Login error:', err);
        // Handle errors - you can add error handling logic here
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }
}
