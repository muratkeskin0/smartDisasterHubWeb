import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { ComplaintService } from '../../../core/services/complaint.service';
import { AuthService } from '../../../core/services/auth.service';
import { Complaint, ComplaintCategory } from '../../../models';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { BaseButtonComponent } from '../../../shared/components/base-button/base-button';
import { AppTipComponent } from '../../../shared/components/app-tip/app-tip';

@Component({
  selector: 'app-complaint-submit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    TranslocoPipe,
    AppHeaderComponent,
    BackButtonComponent,
    BaseButtonComponent,
    AppTipComponent
  ],
  templateUrl: './complaint-submit.html',
  styleUrl: './complaint-submit.css'
})
export class ComplaintSubmitComponent implements OnInit {
  private fb = inject(FormBuilder);
  private complaintService = inject(ComplaintService);
  private authService = inject(AuthService);
  private router = inject(Router);

  submitting = signal(false);
  errorKey = signal<string | null>(null);
  success = signal(false);
  myComplaints = signal<Complaint[]>([]);
  loadingMine = signal(false);

  readonly categories: ComplaintCategory[] = ['BUG', 'CONTENT', 'ACCOUNT', 'OTHER'];

  form = this.fb.group({
    category: ['OTHER' as ComplaintCategory, Validators.required],
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    body: ['', [Validators.required, Validators.maxLength(5000)]]
  });

  get backFallback(): string {
    return this.authService.defaultHomeRoute;
  }

  ngOnInit(): void {
    this.loadMine();
  }

  loadMine(): void {
    this.loadingMine.set(true);
    this.complaintService.getMine(0, 10).subscribe({
      next: res => {
        this.loadingMine.set(false);
        if (res.success && res.data) {
          this.myComplaints.set(res.data.content);
        }
      },
      error: () => this.loadingMine.set(false)
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorKey.set(null);
    this.success.set(false);
    const value = this.form.getRawValue();
    this.complaintService.create({
      category: value.category!,
      subject: value.subject!.trim(),
      body: value.body!.trim()
    }).subscribe({
      next: res => {
        this.submitting.set(false);
        if (res.success) {
          this.success.set(true);
          this.form.reset({ category: 'OTHER', subject: '', body: '' });
          this.loadMine();
        } else {
          this.errorKey.set('complaints.submitError');
        }
      },
      error: () => {
        this.submitting.set(false);
        this.errorKey.set('complaints.submitError');
      }
    });
  }

  statusLabel(status: Complaint['status']): string {
    return `complaints.status.${status}`;
  }
}
