import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { ApiErrorService } from '../../../core/services/api-error.service';

@Component({
  selector: 'app-activate-email',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoPipe],
  templateUrl: './activate-email.html',
  styleUrl: './activate-email.css'
})
export class ActivateEmailComponent {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private apiError = inject(ApiErrorService);
  private router = inject(Router);

  loading = signal(true);
  success = signal(false);
  message = signal('');

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading.set(false);
      this.success.set(false);
      this.message.set(this.apiError.translate('errors.auth.invalidActivationLink'));
      return;
    }

    this.authService.activateEmail(token).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (!res.success) {
          this.success.set(false);
          this.message.set(this.apiError.resolveFromResponse(res, 'errors.auth.activationFailed'));
          return;
        }
        this.success.set(true);
        this.message.set(res.message || this.apiError.translate('authActivation.successBody'));
      },
      error: (err) => {
        this.loading.set(false);
        this.success.set(false);
        this.message.set(this.apiError.resolve(err, 'errors.auth.activationFailed'));
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
