import { Component, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

const STORAGE_KEY = 'sdh-lang';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css'
})
export class LanguageSwitcherComponent {
  private transloco = inject(TranslocoService);

  readonly activeLang = this.transloco.activeLang;

  setLang(lang: 'en' | 'tr'): void {
    if (this.transloco.getActiveLang() === lang) return;
    this.transloco.setActiveLang(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }
}
