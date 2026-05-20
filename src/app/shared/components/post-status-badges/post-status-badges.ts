import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { PostModerationStatus, RedditPostStatus } from '../../../models';

@Component({
  selector: 'app-post-status-badges',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './post-status-badges.html',
  styleUrl: './post-status-badges.css'
})
export class PostStatusBadgesComponent {
  @Input() status?: RedditPostStatus | null;
  @Input() moderationStatus?: PostModerationStatus | null;
  @Input() showMlStatus = true;

  getStatusClass(s: RedditPostStatus): string {
    switch (s) {
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

  getModerationClass(s: PostModerationStatus): string {
    switch (s) {
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

  moderationLabelKey(s: PostModerationStatus | null | undefined): string | null {
    switch (s) {
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
}
