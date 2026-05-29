import { API_BASE_URL } from '../../constants/api';

export function isDisplayableImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  const isHttp = u.startsWith('http://') || u.startsWith('https://');
  if (!isHttp) return false;
  return u.includes('i.redd.it') || u.includes('preview.redd.it')
    || u.endsWith('.jpg') || u.endsWith('.jpeg') || u.endsWith('.png')
    || u.endsWith('.webp') || u.endsWith('.gif');
}

/** Same-origin backend proxy avoids Reddit hotlink blocking in browsers. */
export function proxiedMediaUrl(url: string | null | undefined): string | null {
  if (!isDisplayableImageUrl(url)) return null;
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}/api/media/proxy?url=${encodeURIComponent(url!)}`;
}
