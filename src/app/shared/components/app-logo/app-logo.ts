import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { APP_LOGO_URL } from '../../../constants/branding';

export type AppLogoSize = 'header' | 'auth' | 'hero' | 'splash';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-logo.html',
  styleUrl: './app-logo.css'
})
export class AppLogoComponent {
  @Input() size: AppLogoSize = 'header';
  @Input() alt = 'Smart Disaster Hub';

  readonly src = APP_LOGO_URL;
}
