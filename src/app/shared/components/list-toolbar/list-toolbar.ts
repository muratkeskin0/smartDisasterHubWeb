import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

export interface ListSortOption {
  value: string;
  labelKey: string;
}

@Component({
  selector: 'app-list-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoPipe],
  templateUrl: './list-toolbar.html',
  styleUrl: './list-toolbar.css'
})
export class ListToolbarComponent {
  @Input({ required: true }) sortOptions: ListSortOption[] = [];
  @Input() sortBy = '';
  @Input() sortDirection: 'ASC' | 'DESC' = 'DESC';
  @Input() pageSize = 20;
  @Input() pageSizes: number[] = [10, 20, 50];
  @Input() showPageSize = true;
  @Input() showSort = true;

  @Output() sortByChange = new EventEmitter<string>();
  @Output() sortDirectionChange = new EventEmitter<'ASC' | 'DESC'>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() paramsChange = new EventEmitter<void>();

  onSortByChange(value: string): void {
    this.sortByChange.emit(value);
    this.paramsChange.emit();
  }

  onDirectionChange(value: 'ASC' | 'DESC'): void {
    this.sortDirectionChange.emit(value);
    this.paramsChange.emit();
  }

  onPageSizeChange(value: number): void {
    this.pageSizeChange.emit(value);
    this.paramsChange.emit();
  }
}
