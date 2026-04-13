import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-activation-mail-sent',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoPipe],
  templateUrl: './activation-mail-sent.html',
  styleUrl: './activation-mail-sent.css'
})
export class ActivationMailSentComponent {
  private route = inject(ActivatedRoute);
  email = this.route.snapshot.queryParamMap.get('email') || '';
}
