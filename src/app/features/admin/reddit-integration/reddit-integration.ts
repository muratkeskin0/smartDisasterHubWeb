import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { AppTipComponent } from '../../../shared/components/app-tip/app-tip';
import {
  RedditIntegrationService,
  RedditIntegrationSettings
} from '../../../core/services/reddit-integration.service';

const SECRET_MASK = '********';

@Component({
  selector: 'app-reddit-integration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslocoPipe,
    AppHeaderComponent,
    BackButtonComponent,
    AppTipComponent
  ],
  templateUrl: './reddit-integration.html',
  styleUrl: './reddit-integration.css'
})
export class RedditIntegrationComponent implements OnInit {
  private integrationService = inject(RedditIntegrationService);

  loading = true;
  saving = false;
  testing = false;
  fetching = false;
  error: string | null = null;
  success: string | null = null;

  settings: RedditIntegrationSettings | null = null;

  form = {
    clientId: '',
    clientSecret: '',
    username: '',
    password: '',
    userAgent: 'SmartDisasterHub/1.0 (by /u/your_bot)',
    subreddits: 'smartDisasterHub',
    enabled: true
  };

  readonly setupSteps = [
    'redditIntegration.setupStep1',
    'redditIntegration.setupStep2',
    'redditIntegration.setupStep3',
    'redditIntegration.setupStep4',
    'redditIntegration.setupStep5',
    'redditIntegration.setupStep6',
    'redditIntegration.setupStep7',
    'redditIntegration.setupStep8'
  ] as const;

  readonly fieldMapKeys = [
    'redditIntegration.setupMapClientId',
    'redditIntegration.setupMapSecret',
    'redditIntegration.setupMapUsername',
    'redditIntegration.setupMapPassword',
    'redditIntegration.setupMapUserAgent',
    'redditIntegration.setupMapSubreddits'
  ] as const;

  readonly redditAppsUrl = 'https://www.reddit.com/prefs/apps';

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    this.error = null;
    this.integrationService.getSettings().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.applySettings(res.data);
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'redditIntegration.loadError';
        this.loading = false;
      }
    });
  }

  private applySettings(data: RedditIntegrationSettings): void {
    this.settings = data;
    this.form.clientId = data.clientId ?? '';
    this.form.clientSecret = data.clientSecretConfigured ? SECRET_MASK : '';
    this.form.username = data.username ?? '';
    this.form.password = data.passwordConfigured ? SECRET_MASK : '';
    this.form.userAgent = data.userAgent ?? this.form.userAgent;
    this.form.subreddits = data.subreddits ?? 'smartDisasterHub';
    this.form.enabled = data.enabled;
  }

  save(): void {
    if (this.saving) return;
    this.saving = true;
    this.error = null;
    this.success = null;

    const body: Record<string, string | boolean> = {
      clientId: this.form.clientId.trim(),
      username: this.form.username.trim(),
      userAgent: this.form.userAgent.trim(),
      subreddits: this.form.subreddits.trim(),
      enabled: this.form.enabled
    };
    if (this.form.clientSecret.trim() && this.form.clientSecret !== SECRET_MASK) {
      body['clientSecret'] = this.form.clientSecret.trim();
    }
    if (this.form.password.trim() && this.form.password !== SECRET_MASK) {
      body['password'] = this.form.password.trim();
    }

    this.integrationService.updateSettings(body).subscribe({
      next: res => {
        this.saving = false;
        if (res.success && res.data) {
          this.applySettings(res.data);
          this.success = 'redditIntegration.saveSuccess';
        } else {
          this.error = 'redditIntegration.saveError';
        }
      },
      error: () => {
        this.saving = false;
        this.error = 'redditIntegration.saveError';
      }
    });
  }

  testConnection(): void {
    if (this.testing) return;
    this.testing = true;
    this.error = null;
    this.success = null;
    this.integrationService.testConnection().subscribe({
      next: res => {
        this.testing = false;
        if (res.success && res.data) {
          this.applySettings(res.data);
          this.success = res.data.lastTestSuccess
            ? 'redditIntegration.testSuccess'
            : 'redditIntegration.testFailed';
        }
      },
      error: () => {
        this.testing = false;
        this.error = 'redditIntegration.testError';
      }
    });
  }

  fetchNow(): void {
    if (this.fetching) return;
    this.fetching = true;
    this.error = null;
    this.success = null;
    this.integrationService.fetchNow().subscribe({
      next: res => {
        this.fetching = false;
        if (res.success) {
          this.success = 'redditIntegration.fetchSuccess';
          this.loadSettings();
        } else {
          this.error = 'redditIntegration.fetchError';
        }
      },
      error: () => {
        this.fetching = false;
        this.error = 'redditIntegration.fetchError';
      }
    });
  }

  formatInstant(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
  }
}
