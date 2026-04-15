import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TextAnalysisService } from '../../../core/services/text-analysis.service';
import { RedditPost, RedditPostStatus } from '../../../models';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { RedditPostAnalysisPanelComponent } from '../reddit-post-analysis-panel/reddit-post-analysis-panel';

@Component({
  selector: 'app-post-analysis-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AppHeaderComponent,
    BackButtonComponent,
    TranslocoPipe,
    RedditPostAnalysisPanelComponent
  ],
  templateUrl: './post-analysis-detail.html',
  styleUrl: './post-analysis-detail.css'
})
export class PostAnalysisDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private textAnalysisService = inject(TextAnalysisService);
  private transloco = inject(TranslocoService);

  post: RedditPost | null = null;
  loading = true;
  error: string | null = null;

  lightboxOpen = false;
  lightboxUrls: string[] = [];
  lightboxIndex = 0;
  lightboxTitle: string | null = null;

  private failedImageByPostId: Record<number, boolean> = {};

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const redditPostId = params.get('redditPostId');
      if (!redditPostId) {
        this.error = 'Missing post id';
        this.loading = false;
        return;
      }
      this.loadPost(redditPostId);
    });
  }

  private loadPost(redditPostId: string): void {
    this.loading = true;
    this.error = null;
    this.post = null;

    this.textAnalysisService.getPostByRedditId(redditPostId).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.post = res.data;
        } else {
          this.error = res.message || 'Post not found';
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load post';
        this.loading = false;
      }
    });
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const locale = this.transloco.getActiveLang() === 'tr' ? 'tr-TR' : 'en-US';
    return date.toLocaleDateString(locale, {
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

  getImageMatchStatus(post: RedditPost): { labelKey: string; css: string; hintKey?: string } | null {
    if (!post.mediaUrl || !this.isDisplayableImageUrl(post.mediaUrl) || this.isImageFailed(post.id)) return null;

    if (post.isImageTextMatch === true) {
      return { labelKey: 'textAnalysis.matchStatusYes', css: 'match-yes' };
    }
    if (post.isImageTextMatch === false) {
      return { labelKey: 'textAnalysis.matchStatusNo', css: 'match-no' };
    }

    const score = post.relevanceScore ?? null;
    if (score !== null && score < 0.7) {
      return { labelKey: 'textAnalysis.matchStatusSkipped', css: 'match-skip', hintKey: 'textAnalysis.matchHintLowRelevance' };
    }
    return { labelKey: 'textAnalysis.matchStatusNa', css: 'match-na', hintKey: 'textAnalysis.matchHintNa' };
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
