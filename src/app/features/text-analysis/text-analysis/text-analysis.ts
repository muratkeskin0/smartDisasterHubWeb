import { Component, OnInit, inject } from '@angular/core';
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

  loadData(): void {
    this.loading = true;
    this.error = null;

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

  openRedditPost(url: string): void {
    window.open(url, '_blank');
  }
}




