const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const store = new Map<string, number[]>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = store.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return false;
  recent.push(now);
  store.set(ip, recent);
  return true;
}
