/**
 * Public visitor origin used in QR codes.
 * Prefer VITE_PUBLIC_APP_URL (e.g. https://your-app.vercel.app)
 * so codes work even when admin is opened from localhost.
 */
export function getPublicAppOrigin() {
  const configured = (
    import.meta.env.VITE_PUBLIC_APP_URL ||
    ''
  ).trim();

  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return '';
}

/** Rewrite a stored QR URL onto the public app origin (keeps path + query). */
export function toPublicAppUrl(storedUrl) {
  const origin = getPublicAppOrigin();

  if (!storedUrl || !origin) {
    return storedUrl || '';
  }

  try {
    const parsed = new URL(storedUrl, origin);
    return origin + parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return storedUrl;
  }
}
