import type { Dispatcher, RequestInit as UndiciRequestInit } from "undici";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import type { ZaloFetch } from "./api.js";

const KEEP_ALIVE_TIMEOUT_MS = 30_000;
const KEEP_ALIVE_MAX_TIMEOUT_MS = 10 * 60 * 1000;

const proxyCache = new Map<string, ZaloFetch>();

export function resolveZaloProxyFetch(proxyUrl?: string | null): ZaloFetch | undefined {
  const trimmed = proxyUrl?.trim();
  if (!trimmed) {
    return undefined;
  }
  const cached = proxyCache.get(trimmed);
  if (cached) {
    return cached;
  }
  const agent = new ProxyAgent({
    uri: trimmed,
    keepAliveTimeout: KEEP_ALIVE_TIMEOUT_MS,
    keepAliveMaxTimeout: KEEP_ALIVE_MAX_TIMEOUT_MS,
  });
  const fetcher: ZaloFetch = (input, init) =>
    undiciFetch(input, {
      ...init,
      dispatcher: agent,
    } as UndiciRequestInit) as unknown as Promise<Response>;
  proxyCache.set(trimmed, fetcher);
  return fetcher;
}
