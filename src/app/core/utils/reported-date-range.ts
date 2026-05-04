import { HttpParams } from '@angular/common/http';

export type ReportedRangePreset = 'all' | 'today' | 'week' | 'month';

export interface ReportedRange {
  fromIso: string | null;
  toIso: string | null;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/**
 * Maps UI presets to API `from` / `to` (ISO-8601) for backend filtering by Reddit post time (`redditCreatedAt`).
 * Week = last 7 local calendar days including today; month = last 30 local days including today.
 */
export function rangeForPreset(preset: ReportedRangePreset): ReportedRange {
  const now = new Date();
  switch (preset) {
    case 'all':
      return { fromIso: null, toIso: null };
    case 'today':
      return {
        fromIso: startOfLocalDay(now).toISOString(),
        toIso: endOfLocalDay(now).toISOString()
      };
    case 'week': {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return {
        fromIso: startOfLocalDay(from).toISOString(),
        toIso: endOfLocalDay(now).toISOString()
      };
    }
    case 'month': {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return {
        fromIso: startOfLocalDay(from).toISOString(),
        toIso: endOfLocalDay(now).toISOString()
      };
    }
  }
}

export function hasReportedRange(range: ReportedRange): boolean {
  return Boolean(range.fromIso || range.toIso);
}

export function appendReportedRangeParams(params: HttpParams, range: ReportedRange): HttpParams {
  let next = params;
  if (range.fromIso) {
    next = next.set('from', range.fromIso);
  }
  if (range.toIso) {
    next = next.set('to', range.toIso);
  }
  return next;
}

/** ISO range from `<input type="datetime-local">` values (browser local). */
export function buildRedditPostRangeFromDatetimeLocals(fromLocal: string, toLocal: string): ReportedRange {
  const fromT = (fromLocal ?? '').trim();
  const toT = (toLocal ?? '').trim();
  let fromIso: string | null = null;
  let toIso: string | null = null;
  if (fromT) {
    const d = new Date(fromT);
    if (!Number.isNaN(d.getTime())) {
      fromIso = d.toISOString();
    }
  }
  if (toT) {
    const d = new Date(toT);
    if (!Number.isNaN(d.getTime())) {
      toIso = d.toISOString();
    }
  }
  return { fromIso, toIso };
}

/** Validates non-empty custom fields before applying a custom Reddit post date filter. */
export function tryApplyCustomRedditPostDateRange(
  fromLocal: string,
  toLocal: string
): { ok: true; range: ReportedRange } | { ok: false; i18nKey: string } {
  const fromT = (fromLocal ?? '').trim();
  const toT = (toLocal ?? '').trim();
  if (!fromT && !toT) {
    return { ok: false, i18nKey: 'common.dateFilter.customNeedOne' };
  }
  const range = buildRedditPostRangeFromDatetimeLocals(fromLocal, toLocal);
  if ((fromT && !range.fromIso) || (toT && !range.toIso)) {
    return { ok: false, i18nKey: 'common.dateFilter.customInvalid' };
  }
  return { ok: true, range };
}
