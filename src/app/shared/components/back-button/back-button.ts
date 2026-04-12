import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoPipe],
  templateUrl: './back-button.html',
  styleUrl: './back-button.css'
})
export class BackButtonComponent {
  @Input() route: string = '/dashboard';
  /** When empty, uses translated default (Back to Dashboard). */
  @Input() label = '';
}




