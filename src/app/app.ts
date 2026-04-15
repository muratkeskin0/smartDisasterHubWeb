import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private transloco = inject(TranslocoService);

  ngOnInit(): void {
    const saved = localStorage.getItem('sdh-lang');
    if (saved === 'en' || saved === 'tr') {
      this.transloco.setActiveLang(saved);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = this.transloco.getActiveLang();
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    this.transloco.langChanges$.subscribe(lang => {
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
      }
    });
  }
}
