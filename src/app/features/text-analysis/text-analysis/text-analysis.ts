import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TextAnalysisService, PageResponse } from '../../../core/services/text-analysis.service';
import { RedditPost, PostStatistics, RedditPostStatus } from '../../../models';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';

@Component({
  selector: 'app-text-analysis',
  standalone: true,
  imports: [CommonModule, RouterModule, AppHeaderComponent, BackButtonComponent],
  templateUrl: './text-analysis.html',
  styleUrl: './text-analysis.css'
})
export class TextAnalysisComponent implements OnInit {
  private textAnalysisService = inject(TextAnalysisService);
  
  posts: RedditPost[] = [];
  statistics: PostStatistics | null = null;
  loading = true;
  error: string | null = null;
  filterDisasterOnly = false;

  // Lightbox / gallery
  lightboxOpen = false;
  lightboxUrls: string[] = [];
  lightboxIndex = 0;
  lightboxTitle: string | null = null;

  private failedImageByPostId: Record<number, boolean> = {};
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  
  // Sorting
  sortBy = 'analyzedAt';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(refreshJobs: boolean = false): void {
    this.loading = true;
    this.error = null;

    // If refresh is requested, trigger jobs first
    if (refreshJobs) {
      this.textAnalysisService.triggerRefresh().subscribe({
        next: (response) => {
          if (response.success) {
            console.log('Refresh jobs triggered successfully');
            // Wait a bit for jobs to complete, then load data
            setTimeout(() => {
              this.loadDataInternal();
            }, 2000); // Wait 2 seconds for jobs to process
          } else {
            console.error('Error triggering refresh:', response.message);
            this.loadDataInternal();
          }
        },
        error: (err) => {
          console.error('Error triggering refresh:', err);
          // Continue loading data even if refresh fails
          this.loadDataInternal();
        }
      });
    } else {
      this.loadDataInternal();
    }
  }

  private loadDataInternal(): void {
    // Load statistics
    this.textAnalysisService.getStatistics().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.statistics = response.data;
        }
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
      }
    });

    // Load posts with pagination
    const postsObservable = this.filterDisasterOnly
      ? this.textAnalysisService.getDisasterRelatedPosts(this.currentPage, this.pageSize, this.sortBy, this.sortDirection)
      : this.textAnalysisService.getAnalyzedPosts(this.currentPage, this.pageSize, this.sortBy, this.sortDirection);

    postsObservable.subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const pageData: PageResponse<RedditPost> = response.data;
          this.posts = pageData.content;
          this.totalPages = pageData.totalPages;
          this.totalElements = pageData.totalElements;
          this.currentPage = pageData.page;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading posts:', err);
        this.error = 'Failed to load posts. Please try again later.';
        this.loading = false;
      }
    });
  }

  toggleFilter(): void {
    this.filterDisasterOnly = !this.filterDisasterOnly;
    this.currentPage = 0; // Reset to first page when filtering
    this.loadData();
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadData();
    }
  }

  changeSort(field: string): void {
    if (this.sortBy === field) {
      // Toggle direction if same field
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortDirection = 'DESC';
    }
    this.currentPage = 0; // Reset to first page when sorting
    this.loadData();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 7; // Show max 7 page numbers
    
    if (this.totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than max
      for (let i = 0; i < this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(0);
      
      const startPage = Math.max(1, this.currentPage - 1);
      const endPage = Math.min(this.totalPages - 2, this.currentPage + 1);
      
      if (startPage > 1) {
        pages.push(-1); // Ellipsis
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < this.totalPages - 2) {
        pages.push(-1); // Ellipsis
      }
      
      // Show last page
      pages.push(this.totalPages - 1);
    }
    
    return pages;
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: RedditPostStatus): string {
    switch (status) {
      case RedditPostStatus.ANALYZED:
        return 'status-analyzed';
      case RedditPostStatus.PENDING:
        return 'status-pending';
      case RedditPostStatus.FAILED:
        return 'status-failed';
      default:
        return '';
    }
  }

  getRelevanceClass(score: number | null | undefined): string {
    if (!score) return '';
    if (score >= 0.7) return 'relevance-high';
    if (score >= 0.4) return 'relevance-medium';
    return 'relevance-low';
  }

  /**
   * Split comma-separated humanitarianCategories into display-friendly chips.
   */
  getHumanitarianCategories(post: RedditPost): string[] {
    if (!post.humanitarianCategories) {
      return [];
    }
    return post.humanitarianCategories
      .split(',')
      .map(c => c.trim())
      .filter(c => !!c)
      .map(c =>
        c
          .replace(/_/g, ' ')
          .replace(/\b\w/g, ch => ch.toUpperCase())
      );
  }

  openRedditPost(url: string): void {
    window.open(url, '_blank');
  }

  hasCoordinates(post: RedditPost): boolean {
    return (
      post.latitude != null &&
      post.longitude != null &&
      !Number.isNaN(Number(post.latitude)) &&
      !Number.isNaN(Number(post.longitude))
    );
  }

  openStreetMapUrl(post: RedditPost): string {
    const lat = Number(post.latitude);
    const lon = Number(post.longitude);
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`;
  }

  isDisplayableImageUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    const u = url.toLowerCase();
    const isHttp = u.startsWith('http://') || u.startsWith('https://');
    if (!isHttp) return false;
    return u.includes('i.redd.it') || u.includes('preview.redd.it')
      || u.endsWith('.jpg') || u.endsWith('.jpeg') || u.endsWith('.png') || u.endsWith('.webp') || u.endsWith('.gif');
  }

  markImageFailed(postId: number): void {
    this.failedImageByPostId[postId] = true;
  }

  isImageFailed(postId: number): boolean {
    return !!this.failedImageByPostId[postId];
  }

  getImageMatchStatus(post: RedditPost): { label: string; css: string; hint?: string } | null {
    if (!post.mediaUrl || !this.isDisplayableImageUrl(post.mediaUrl) || this.isImageFailed(post.id)) return null;

    // If we have a value, show it.
    if (post.isImageTextMatch === true) {
      return { label: 'Match: Yes', css: 'match-yes' };
    }
    if (post.isImageTextMatch === false) {
      return { label: 'Match: No', css: 'match-no' };
    }

    // Otherwise it wasn't analyzed (or not applicable).
    const score = post.relevanceScore ?? null;
    if (score !== null && score < 0.7) {
      return { label: 'Match: Skipped', css: 'match-skip', hint: 'Skipped because relevance score < 70%' };
    }
    return { label: 'Match: Not analyzed', css: 'match-na', hint: 'Not analyzed yet (or OpenAI disabled)' };
  }

  openLightbox(post: RedditPost): void {
    const rawUrls = (post.mediaUrls && post.mediaUrls.length > 0)
      ? post.mediaUrls
      : (post.mediaUrl ? [post.mediaUrl] : []);

    const urls = rawUrls.filter(u => this.isDisplayableImageUrl(u));
    if (!urls || urls.length === 0) return;

    this.lightboxUrls = urls;
    this.lightboxIndex = 0;
    this.lightboxTitle = post.title || null;
    this.lightboxOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    this.lightboxUrls = [];
    this.lightboxIndex = 0;
    this.lightboxTitle = null;
    document.body.style.overflow = '';
  }

  nextImage(): void {
    if (!this.lightboxUrls || this.lightboxUrls.length <= 1) return;
    this.lightboxIndex = (this.lightboxIndex + 1) % this.lightboxUrls.length;
  }

  prevImage(): void {
    if (!this.lightboxUrls || this.lightboxUrls.length <= 1) return;
    this.lightboxIndex = (this.lightboxIndex - 1 + this.lightboxUrls.length) % this.lightboxUrls.length;
  }

  onLightboxBackdropClick(ev: MouseEvent): void {
    // Only close when clicking the backdrop itself (not the content)
    const target = ev.target as HTMLElement | null;
    if (target && target.classList.contains('lightbox-backdrop')) {
      this.closeLightbox();
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (!this.lightboxOpen) return;
    if (event.key === 'Escape') {
      this.closeLightbox();
    } else if (event.key === 'ArrowRight') {
      this.nextImage();
    } else if (event.key === 'ArrowLeft') {
      this.prevImage();
    }
  }
}






