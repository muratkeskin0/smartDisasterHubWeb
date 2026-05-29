import { HttpErrorResponse } from '@angular/common/http';
import { ApiResponse } from '../../models';

export interface ParsedApiError {
  code?: string;
  message?: string;
  validationErrors?: Record<string, string>;
  status?: number;
}

function readBody(body: unknown): Partial<ApiResponse<unknown>> | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  return body as Partial<ApiResponse<unknown>>;
}

export function parseApiError(error: unknown): ParsedApiError {
  if (error instanceof HttpErrorResponse) {
    const body = readBody(error.error);
    const code = body?.error?.code;
    const details = body?.error?.details?.trim();
    const message = body?.message?.trim();
    const validationErrors = body?.error?.validationErrors;

    return {
      code,
      message: details || message || undefined,
      validationErrors,
      status: error.status || undefined
    };
  }

  if (error && typeof error === 'object' && 'success' in error) {
    const body = readBody(error);
    if (body && body.success === false) {
      return {
        code: body.error?.code,
        message: body.error?.details?.trim() || body.message?.trim() || undefined,
        validationErrors: body.error?.validationErrors
      };
    }
  }

  return {};
}

export function isAuthRequestUrl(url: string): boolean {
  return /\/auth\/(login|register|activate|resend)/i.test(url);
}

export function errorCodeI18nKey(code?: string): string | null {
  if (!code) {
    return null;
  }
  return `errors.codes.${code}`;
}

export function httpStatusI18nKey(status?: number): string | null {
  if (!status) {
    return 'errors.network';
  }
  if (status === 401) return 'errors.unauthorized';
  if (status === 403) return 'errors.forbidden';
  if (status === 404) return 'errors.notFound';
  if (status === 409) return 'errors.conflict';
  if (status === 429) return 'errors.rateLimit';
  if (status >= 500) return 'errors.server';
  return null;
}
