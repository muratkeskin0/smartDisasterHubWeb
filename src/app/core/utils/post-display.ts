/** True when Reddit post title is null, undefined, or whitespace-only. */
export function isPostTitleBlank(title: string | null | undefined): boolean {
  return !title?.trim();
}

/** Display title with a localized fallback when blank. */
export function displayPostTitle(title: string | null | undefined, untitledLabel: string): string {
  const trimmed = title?.trim();
  return trimmed ? trimmed : untitledLabel;
}
