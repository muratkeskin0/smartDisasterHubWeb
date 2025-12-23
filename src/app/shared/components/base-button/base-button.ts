import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-base-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './base-button.html',
  styleUrl: './base-button.css'
})
export class BaseButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' = 'primary';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  
  @Output() buttonClick = new EventEmitter<MouseEvent>();

  buttonClasses = computed(() => ({
    'base-button': true,
    [`variant-${this.variant}`]: true,
    [`size-${this.size}`]: true,
    'full-width': this.fullWidth,
    'is-loading': this.loading,
    'is-disabled': this.disabled
  }));

  get loadingText(): string {
    switch (this.variant) {
      case 'primary': return 'Loading...';
      case 'danger': return 'Deleting...';
      case 'success': return 'Saving...';
      default: return 'Processing...';
    }
  }

  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.buttonClick.emit(event);
    }
  }
}
