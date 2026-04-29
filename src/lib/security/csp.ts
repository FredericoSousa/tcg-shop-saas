export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function buildCspHeader(nonce: string, isDev: boolean): string {
  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;

  // 'unsafe-inline' is kept in dev only; production locks to nonce.
  // Tailwind v4 + Next inject styles via <style> tags Next tags with
  // the same nonce we expose via x-nonce, so nonce-only works.
  const styleSrc = isDev
    ? `'self' 'nonce-${nonce}' 'unsafe-inline'`
    : `'self' 'nonce-${nonce}'`;

  const directives: Record<string, string> = {
    "default-src": "'self'",
    "script-src": scriptSrc,
    "style-src": styleSrc,
    "img-src":
      "'self' blob: data: https://cards.scryfall.io https://c1.scryfall.com https://svgs.scryfall.io https://*.supabase.co",
    "font-src": "'self' data:",
    "connect-src": "'self' https://*.supabase.co https://api.scryfall.com",
    "frame-ancestors": "'none'",
    "base-uri": "'self'",
    "form-action": "'self'",
    "object-src": "'none'",
    "upgrade-insecure-requests": "",
  };

  return Object.entries(directives)
    .map(([k, v]) => (v ? `${k} ${v}` : k))
    .join("; ");
}
