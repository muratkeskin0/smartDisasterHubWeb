import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ApiResponse } from '../../models';
import {
  errorCodeI18nKey,
  httpStatusI18nKey,
  parseApiError
} from '../utils/api-error.util';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  private transloco = inject(TranslocoService);

  translate(key: string, params?: Record<string, string>): string {
    return this.transloco.translate(key, params);
  }

  resolve(error: unknown, fallbackKey = 'errors.generic'): string {
    const parsed = parseApiError(error);
    return this.resolveParsed(parsed, fallbackKey);
  }

  resolveFromResponse(response: ApiResponse<unknown>, fallbackKey = 'errors.generic'): string {
    if (response.success) {
      return '';
    }
    return this.resolveParsed(
      {
        code: response.error?.code,
        message: response.error?.details?.trim() || response.message?.trim() || undefined,
        validationErrors: response.error?.validationErrors
      },
      fallbackKey
    );
  }

  resolveKeyOrMessage(value: string, fallbackKey = 'errors.generic'): string {
    const translated = this.transloco.translate(value);
    if (translated !== value) {
      return translated;
    }
    return value || this.transloco.translate(fallbackKey);
  }

  private resolveParsed(
    parsed: ReturnType<typeof parseApiError>,
    fallbackKey: string
  ): string {
    const codeKey = errorCodeI18nKey(parsed.code);
    if (codeKey && this.hasTranslation(codeKey)) {
      return this.transloco.translate(codeKey);
    }

    if (parsed.message) {
      return parsed.message;
    }

    const statusKey = httpStatusI18nKey(parsed.status);
    if (statusKey && this.hasTranslation(statusKey)) {
      return this.transloco.translate(statusKey);
    }

    if (parsed.validationErrors) {
      const first = Object.values(parsed.validationErrors).find(v => v?.trim());
      if (first) {
        return first;
      }
      if (this.hasTranslation('errors.validation')) {
        return this.transloco.translate('errors.validation');
      }
    }

    if (parsed.status === 0) {
      return this.transloco.translate('errors.network');
    }

    return this.transloco.translate(fallbackKey);
  }

  private hasTranslation(key: string): boolean {
    return this.transloco.translate(key) !== key;
  }
}
