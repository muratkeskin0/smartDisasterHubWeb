import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * Single back control for the app.
 * - `history` (default): optional sanitized `returnUrl`, else browser history back.
 * - `home`: always navigate to `fallbackRoute` (e.g. About page for bookmark/direct entry).
 * `fixedRoute` overrides everything when set.
 */
@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './back-button.html',
  styleUrl: './back-button.css'
})
export class BackButtonComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  /** When set, always navigate here (e.g. rare forced targets). */
  @Input() fixedRoute: string | null = null;

  /**
   * `history`: prefer `returnUrl`, then Location.back().
   * `home`: always `fallbackRoute` (no history) — use for About-style pages.
   */
  @Input() strategy: 'history' | 'home' = 'history';

  /** Used when `strategy === 'home'`, or as semantic default for analytics only. */
  @Input() fallbackRoute = '/dashboard';

  /**
   * Sanitized in-app path from query (e.g. `/text-analysis`) so deep links return to the right list.
   */
  @Input() returnUrl: string | null = null;

  /** Visible label; empty uses `common.back`. */
  @Input() label = '';

  /** Stretch to container width (e.g. mobile). */
  @Input() block = false;

  navigate(): void {
    if (this.fixedRoute) {
      void this.router.navigateByUrl(this.fixedRoute);
      return;
    }
    if (this.strategy === 'home') {
      void this.router.navigateByUrl(this.fallbackRoute);
      return;
    }
    const target = this.returnUrl?.trim();
    if (target) {
      void this.router.navigateByUrl(target);
      return;
    }
    this.location.back();
  }
}
