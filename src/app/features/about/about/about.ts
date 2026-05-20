import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { AppPublicFooterComponent } from '../../../shared/components/app-public-footer/app-public-footer';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';

/**
 * About copy is driven by i18n (en.json / tr.json) so it follows the active language.
 * API-stored HTML is not used here; add a merge strategy later if admin-edited DB content is required.
 */
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, AppHeaderComponent, AppPublicFooterComponent, BackButtonComponent, TranslocoPipe],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class AboutComponent {
  authService = inject(AuthService);
}
