import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password-sent',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoPipe],
  templateUrl: './forgot-password-sent.html',
  styleUrl: './forgot-password-sent.css'
})
export class ForgotPasswordSentComponent {
  private route = inject(ActivatedRoute);
  email = this.route.snapshot.queryParamMap.get('email') || '';
}
