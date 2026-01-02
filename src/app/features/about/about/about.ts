import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { AboutService } from '../../../core/services/about.service';
import { About } from '../../../models';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, AppHeaderComponent, BackButtonComponent],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class AboutComponent implements OnInit {
  private aboutService = inject(AboutService);
  
  about: About | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadAbout();
  }

  loadAbout(): void {
    this.loading = true;
    this.error = null;
    
    this.aboutService.getAbout().subscribe({
      next: (about) => {
        this.about = about;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading about content:', err);
        this.error = 'Failed to load about content. Please try again later.';
        this.loading = false;
      }
    });
  }
}



