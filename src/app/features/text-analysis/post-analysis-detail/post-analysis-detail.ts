import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TextAnalysisService } from '../../../core/services/text-analysis.service';
import { AuthService } from '../../../core/services/auth.service';
import { ModerationQueueScope } from '../../../constants/roles';
import { PostModerationStatus, RedditPost, RedditPostStatus } from '../../../models';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { AppTipComponent } from '../../../shared/components/app-tip/app-tip';
import { PostStatusBadgesComponent } from '../../../shared/components/post-status-badges/post-status-badges';
import { RedditPostAnalysisPanelComponent } from '../reddit-post-analysis-panel/reddit-post-analysis-panel';

@Component({
  selector: 'app-post-analysis-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AppHeaderComponent,
    BackButtonComponent,
    AppTipComponent,
    PostStatusBadgesComponent,
    TranslocoPipe,
    RedditPostAnalysisPanelComponent
  ],
  templateUrl: './post-analysis-detail.html',
  styleUrl: './post-analysis-detail.css'
})
export class PostAnalysisDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private textAnalysisService = inject(TextAnalysisService);
  private authService = inject(AuthService);
  private transloco = inject(TranslocoService);

  /** Sanitized in-app path from `?returnUrl=` (e.g. /reports, /text-analysis). */
  returnUrl: string | null = null;

  post: RedditPost | null = null;
  loading = true;
  error: string | null = null;
  moderating = false;
  moderationMessage: string | null = null;
  rejectNotes = '';

  /** Moderation queue context when opened from `/moderation`. */
  queuePage = 0;
  queueIndex = 0;
  queueSortBy = 'relevanceScore';
  queueSortDirection: 'ASC' | 'DESC' = 'DESC';
  queuePageSize = 10;
  queueScope: ModerationQueueScope = 'MINE';
  queuePosts: RedditPost[] = [];
  totalQueuePages = 0;
  queueLoading = false;

  lightboxOpen = false;
  lightboxUrls: string[] = [];
  lightboxIndex = 0;
  lightboxTitle: string | null = null;

  private failedImageByPostId: Record<number, boolean> = {};

  ngOnInit(): void {
    this.route.queryParams.subscribe(q => {
      this.returnUrl = PostAnalysisDetailComponent.sanitizeReturnUrl(q['returnUrl']);
      this.queuePage = PostAnalysisDetailComponent.parseNonNegInt(q['queuePage'], 0);
      this.queueIndex = PostAnalysisDetailComponent.parseNonNegInt(q['queueIndex'], 0);
      const sort = typeof q['queueSort'] === 'string' ? q['queueSort'].trim() : '';
      if (sort) {
        this.queueSortBy = sort;
      }
      this.queueSortDirection = q['queueDir'] === 'ASC' ? 'ASC' : 'DESC';
      const size = PostAnalysisDetailComponent.parseNonNegInt(q['queueSize'], 0);
      if (size > 0) {
        this.queuePageSize = size;
      }
      const scope = typeof q['queueScope'] === 'string' ? q['queueScope'].toUpperCase() : '';
      if (scope === 'MINE' || scope === 'UNASSIGNED' || scope === 'ALL') {
        this.queueScope = scope as ModerationQueueScope;
      } else {
        this.queueScope = this.authService.isAdmin ? 'ALL' : 'MINE';
      }
    });
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

  get isModerationQueue(): boolean {
    return this.returnUrl === '/moderation';
  }

  get canGoPrevInQueue(): boolean {
    return this.isModerationQueue && (this.queueIndex > 0 || this.queuePage > 0);
  }

  get canGoNextInQueue(): boolean {
    return (
      this.isModerationQueue &&
      (this.queueIndex < this.queuePosts.length - 1 || this.queuePage < this.totalQueuePages - 1)
    );
  }

  private static parseNonNegInt(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : fallback;
  }

  private static sanitizeReturnUrl(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }
    let t = value.trim();
    try {
      t = decodeURIComponent(t);
    } catch {
      return null;
    }
    t = t.trim();
    if (!t.startsWith('/') || t.startsWith('//')) {
      return null;
    }
    if (t.includes('://') || t.includes('\\')) {
      return null;
    }
    const lower = t.toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:')) {
      return null;
    }
    if (t.length > 256) {
      return null;
    }
    return t;
  }

  private loadPost(redditPostId: string): void {
    this.loading = true;
    this.error = null;
    this.post = null;

    this.textAnalysisService.getPostByRedditId(redditPostId).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.post = res.data;
          if (this.isModerationQueue) {
            this.loadQueueContext();
          }
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

  get isPendingModeration(): boolean {
    return this.post?.moderationStatus === PostModerationStatus.PENDING_REVIEW;
  }

  getModerationClass(status: PostModerationStatus | null | undefined): string {
    switch (status) {
      case PostModerationStatus.PENDING_REVIEW:
        return 'mod-badge--pending';
      case PostModerationStatus.APPROVED:
        return 'mod-badge--approved';
      case PostModerationStatus.REJECTED:
        return 'mod-badge--rejected';
      case PostModerationStatus.NOT_REQUIRED:
        return 'mod-badge--skipped';
      default:
        return '';
    }
  }

  moderationLabelKey(status: PostModerationStatus | null | undefined): string | null {
    switch (status) {
      case PostModerationStatus.PENDING_REVIEW:
        return 'moderation.statusPending';
      case PostModerationStatus.APPROVED:
        return 'moderation.statusApproved';
      case PostModerationStatus.REJECTED:
        return 'moderation.statusRejected';
      case PostModerationStatus.NOT_REQUIRED:
        return 'moderation.statusNotRequired';
      default:
        return null;
    }
  }

  loadQueueContext(page = this.queuePage): void {
    if (!this.isModerationQueue) {
      return;
    }
    this.queueLoading = true;
    this.textAnalysisService
      .getModerationPending(page, this.queuePageSize, this.queueSortBy, this.queueSortDirection, this.queueScope)
      .subscribe({
        next: res => {
          this.queueLoading = false;
          if (res.success && res.data) {
            this.queuePosts = res.data.content;
            this.queuePage = res.data.page;
            this.totalQueuePages = res.data.totalPages;
            const idx = this.post ? this.queuePosts.findIndex(p => p.id === this.post!.id) : -1;
            if (idx >= 0) {
              this.queueIndex = idx;
            }
          }
        },
        error: () => {
          this.queueLoading = false;
        }
      });
  }

  goPrevInQueue(): void {
    if (!this.canGoPrevInQueue || this.queueLoading) {
      return;
    }
    if (this.queueIndex > 0) {
      const target = this.queuePosts[this.queueIndex - 1];
      this.navigateToQueuePost(target, this.queuePage, this.queueIndex - 1);
      return;
    }
    if (this.queuePage > 0) {
      this.loadQueuePageAndSelect(this.queuePage - 1, 'last');
    }
  }

  goNextInQueue(): void {
    if (!this.canGoNextInQueue || this.queueLoading) {
      return;
    }
    if (this.queueIndex < this.queuePosts.length - 1) {
      const target = this.queuePosts[this.queueIndex + 1];
      this.navigateToQueuePost(target, this.queuePage, this.queueIndex + 1);
      return;
    }
    if (this.queuePage < this.totalQueuePages - 1) {
      this.loadQueuePageAndSelect(this.queuePage + 1, 'first');
    }
  }

  private loadQueuePageAndSelect(page: number, which: 'first' | 'last'): void {
    this.queueLoading = true;
    this.textAnalysisService
      .getModerationPending(page, this.queuePageSize, this.queueSortBy, this.queueSortDirection, this.queueScope)
      .subscribe({
        next: res => {
          this.queueLoading = false;
          if (!res.success || !res.data?.content?.length) {
            return;
          }
          const posts = res.data.content;
          const target = which === 'first' ? posts[0] : posts[posts.length - 1];
          const index = which === 'first' ? 0 : posts.length - 1;
          this.navigateToQueuePost(target, page, index);
        },
        error: () => {
          this.queueLoading = false;
        }
      });
  }

  private navigateToQueuePost(post: RedditPost, page: number, index: number): void {
    this.router.navigate(['/text-analysis/post', post.redditPostId], {
      queryParams: {
        returnUrl: '/moderation',
        queuePage: page,
        queueIndex: index,
        queueSort: this.queueSortBy,
        queueDir: this.queueSortDirection,
        queueSize: this.queuePageSize,
        queueScope: this.queueScope
      }
    });
  }

  approvePost(): void {
    if (!this.post || this.moderating) return;
    this.moderating = true;
    this.textAnalysisService.approvePost(this.post.id).subscribe({
      next: res => {
        this.moderating = false;
        if (res.success && res.data) {
          this.post = res.data;
          this.moderationMessage = 'moderation.actionSuccess';
          if (this.isModerationQueue) {
            this.goNextInQueue();
          }
        }
      },
      error: () => {
        this.moderating = false;
        this.error = 'moderation.actionFailed';
      }
    });
  }

  rejectPost(): void {
    if (!this.post || this.moderating) return;
    this.moderating = true;
    const notes = this.rejectNotes.trim() || null;
    this.textAnalysisService.rejectPost(this.post.id, notes).subscribe({
      next: res => {
        this.moderating = false;
        if (res.success && res.data) {
          this.post = res.data;
          this.moderationMessage = 'moderation.actionSuccess';
          if (this.isModerationQueue) {
            this.goNextInQueue();
          }
        }
      },
      error: () => {
        this.moderating = false;
        this.error = 'moderation.actionFailed';
      }
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

  /** `returnUrl` when opening the canonical duplicate post so user can come back here. */
  duplicateBackReturnUrl(): string {
    const id = this.post?.redditPostId;
    if (!id) {
      return this.router.url.split('?')[0] || '/text-analysis';
    }
    return `/text-analysis/post/${encodeURIComponent(id)}`;
  }
}
