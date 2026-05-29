import { Component, effect, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { ComplaintService } from '../../../core/services/complaint.service';
import { StaffInboxService } from '../../../core/services/staff-inbox.service';
import { AuthService } from '../../../core/services/auth.service';
import { Complaint, ComplaintStats } from '../../../models';
import { ComplaintInboxScope } from '../../../constants/roles';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { ListSortOption, ListToolbarComponent } from '../../../shared/components/list-toolbar/list-toolbar';
import { AppTipComponent } from '../../../shared/components/app-tip/app-tip';

@Component({
  selector: 'app-complaint-inbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoPipe,
    AppHeaderComponent,
    BackButtonComponent,
    ListToolbarComponent,
    AppTipComponent
  ],
  templateUrl: './complaint-inbox.html',
  styleUrl: './complaint-inbox.css'
})
export class ComplaintInboxComponent implements OnInit {
  private complaintService = inject(ComplaintService);
  private staffInbox = inject(StaffInboxService);
  private authService = inject(AuthService);

  queueScope: ComplaintInboxScope = 'UNASSIGNED';
  complaints: Complaint[] = [];
  selected: Complaint | null = null;
  resolveNotes = '';
  loading = true;
  acting = false;
  error: string | null = null;
  actionMessage: string | null = null;
  stats: ComplaintStats | null = null;

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  sortBy = 'createdAt';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  readonly scopeChips: { id: ComplaintInboxScope; labelKey: string; adminOnly?: boolean }[] = [
    { id: 'UNASSIGNED', labelKey: 'complaints.scopeUnassigned' },
    { id: 'MINE', labelKey: 'complaints.scopeMine' },
    { id: 'ALL', labelKey: 'complaints.scopeAll', adminOnly: true },
    { id: 'RESOLVED', labelKey: 'complaints.scopeResolved' }
  ];

  readonly sortOptions: ListSortOption[] = [
    { value: 'createdAt', labelKey: 'common.sortAnalyzedDate' },
    { value: 'resolvedAt', labelKey: 'complaints.sortResolvedDate' }
  ];

  constructor() {
    effect(() => {
      this.stats = this.staffInbox.complaintStats();
    });
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get backFallback(): string {
    return this.isAdmin ? '/dashboard' : '/complaints/inbox';
  }

  get isResolvedScope(): boolean {
    return this.queueScope === 'RESOLVED';
  }

  get isSelectedClosed(): boolean {
    return this.selected?.status === 'RESOLVED' || this.selected?.status === 'CLOSED';
  }

  get emptyMessageKey(): string {
    return this.isResolvedScope ? 'complaints.inboxEmptyResolved' : 'complaints.inboxEmpty';
  }

  get queueTitleKey(): string {
    return this.isResolvedScope ? 'complaints.queueTitleResolved' : 'complaints.queueTitle';
  }

  get assignedToOther(): boolean {
    if (this.isResolvedScope || this.isSelectedClosed) return false;
    if (!this.selected || this.isAdmin) return false;
    const uid = this.authService.currentUserValue?.id;
    return this.selected.assignedStaffId != null && uid != null && this.selected.assignedStaffId !== uid;
  }

  ngOnInit(): void {
    this.queueScope = this.isAdmin ? 'UNASSIGNED' : 'MINE';
    this.refreshStats();
    this.loadQueue();
  }

  visibleScopeChips() {
    return this.scopeChips.filter(c => !c.adminOnly || this.isAdmin);
  }

  scopeCount(scope: ComplaintInboxScope): number | null {
    return this.staffInbox.complaintScopeCount(scope, this.stats);
  }

  refreshStats(): void {
    this.staffInbox.refreshComplaints();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'ci-status--open';
      case 'IN_PROGRESS':
        return 'ci-status--in-progress';
      case 'RESOLVED':
        return 'ci-status--resolved';
      case 'CLOSED':
        return 'ci-status--closed';
      default:
        return '';
    }
  }

  setQueueScope(scope: ComplaintInboxScope): void {
    if (this.queueScope === scope) return;
    this.queueScope = scope;
    this.currentPage = 0;
    this.selected = null;
    if (scope === 'RESOLVED') {
      this.sortBy = 'resolvedAt';
      this.sortDirection = 'DESC';
    } else if (this.sortBy === 'resolvedAt') {
      this.sortBy = 'createdAt';
      this.sortDirection = 'DESC';
    }
    this.loadQueue();
  }

  onToolbarChange(): void {
    this.currentPage = 0;
    this.loadQueue();
  }

  loadQueue(): void {
    this.loading = true;
    this.error = null;
    this.complaintService.getInbox(
      this.currentPage,
      this.pageSize,
      this.sortBy,
      this.sortDirection,
      this.queueScope
    ).subscribe({
      next: res => {
        this.loading = false;
        if (res.success && res.data) {
          this.complaints = res.data.content;
          this.totalElements = res.data.totalElements;
          if (this.complaints.length > 0) {
            this.selected = this.complaints.find(c => c.id === this.selected?.id) ?? this.complaints[0];
          } else {
            this.selected = null;
          }
        } else {
          this.error = 'complaints.loadError';
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'complaints.loadError';
      }
    });
  }

  select(item: Complaint): void {
    this.selected = item;
    this.resolveNotes = '';
    this.actionMessage = null;
  }

  claim(): void {
    if (!this.selected) return;
    this.runAction(() => this.complaintService.claim(this.selected!.id), 'complaints.claimed');
  }

  release(): void {
    if (!this.selected) return;
    this.runAction(() => this.complaintService.release(this.selected!.id), 'complaints.released');
  }

  resolve(): void {
    if (!this.selected) return;
    this.runAction(
      () => this.complaintService.resolve(this.selected!.id, this.resolveNotes.trim() || undefined),
      'complaints.resolved'
    );
  }

  private runAction(action: () => import('rxjs').Observable<import('../../../models').ApiResponse<Complaint>>, messageKey: string): void {
    this.acting = true;
    this.actionMessage = null;
    action().subscribe({
      next: res => {
        this.acting = false;
        if (res.success) {
          this.actionMessage = messageKey;
          this.refreshStats();
          this.loadQueue();
        } else {
          this.error = 'complaints.actionError';
        }
      },
      error: () => {
        this.acting = false;
        this.error = 'complaints.actionError';
      }
    });
  }

  formatDate(value?: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleString();
  }
}
