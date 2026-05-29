import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-tip.html',
  styleUrl: './app-tip.css'
})
export class AppTipComponent {
  /** Tooltip text (already translated). */
  @Input({ required: true }) text = '';
}
