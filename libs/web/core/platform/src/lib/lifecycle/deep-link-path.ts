/**
 * Router path for a URL that opened the app (MOB-7), including query and hash.
 * `https://app.example.com/account?tab=1` and `com.example.starter://account?tab=1` both give
 * `/account?tab=1`. Returns null for a URL that cannot be parsed.
 */
export function deepLinkPath(url: string): string | null {
  if (!URL.canParse(url)) {
    return null;
  }

  const { protocol, host, pathname, search, hash } = new URL(url);
  const isWebLink = protocol === 'https:' || protocol === 'http:';
  // A custom scheme puts the first path segment in the host: scheme://account/settings.
  const path = isWebLink ? pathname : `/${host}${pathname}`;
  const normalisedPath = `/${path.replace(/^\/+/, '')}`;

  return `${normalisedPath}${search}${hash}`;
}
