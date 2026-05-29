import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RedditPost } from '../../../models';
import { TranslocoPipe } from '@jsverse/transloco';
import { AppTipComponent } from '../../../shared/components/app-tip/app-tip';

/**
 * Full analysis breakdown (text / humanitarian / visual).
 * Used on the post detail screen; list view stays minimal.
 */
@Component({
  selector: 'app-reddit-post-analysis-panel',
  standalone: true,
  imports: [CommonModule, TranslocoPipe, AppTipComponent],
  templateUrl: './reddit-post-analysis-panel.html',
  styleUrl: './reddit-post-analysis-panel.css'
})
export class RedditPostAnalysisPanelComponent {
  @Input({ required: true }) post!: RedditPost;

  getRelevanceClass(score: number | null | undefined): string {
    if (!score) return '';
    if (score >= 0.7) return 'relevance-high';
    if (score >= 0.4) return 'relevance-medium';
    return 'relevance-low';
  }

  formatPercent01(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return (value * 100).toFixed(1);
  }

  hasHumanitarianSection(post: RedditPost): boolean {
    return (
      (post.isHelpRequest !== null && post.isHelpRequest !== undefined) ||
      (post.helpRequestProbability !== null && post.helpRequestProbability !== undefined) ||
      (!!post.humanitarianCategories && post.humanitarianCategories.trim().length > 0)
    );
  }

  hasVisualAnalysisSection(post: RedditPost): boolean {
    const hasMedia = !!(post.mediaUrl && this.isDisplayableImageUrl(post.mediaUrl));
    return (
      hasMedia ||
      post.isImageTextMatch !== null ||
      post.imageTextMatchScore !== null ||
      post.hasImageDamage !== null ||
      post.imageDamageScore !== null ||
      (!!post.imageDamageSeverity && post.imageDamageSeverity.trim().length > 0)
    );
  }

  formatDamageSeverity(sev: string | null | undefined): string {
    if (!sev) return '';
    return sev
      .replace(/_/g, ' ')
      .replace(/\b\w/g, ch => ch.toUpperCase());
  }

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

  private isDisplayableImageUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    const u = url.toLowerCase();
    const isHttp = u.startsWith('http://') || u.startsWith('https://');
    if (!isHttp) return false;
    return u.includes('i.redd.it') || u.includes('preview.redd.it')
      || u.endsWith('.jpg') || u.endsWith('.jpeg') || u.endsWith('.png') || u.endsWith('.webp') || u.endsWith('.gif');
  }
}
