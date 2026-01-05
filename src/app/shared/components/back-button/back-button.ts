import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './back-button.html',
  styleUrl: './back-button.css'
})
export class BackButtonComponent {
  @Input() route: string = '/dashboard';
  @Input() label: string = 'Back to Dashboard';
}




