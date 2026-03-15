import { ProxyAgent, fetch as undiciFetch } from "undici";
import { danger } from "../../globals.js";
import { wrapFetchWithAbortSignal } from "../../infra/fetch.js";
import {
  UNDICI_KEEP_ALIVE_MAX_TIMEOUT_MS,
  UNDICI_KEEP_ALIVE_TIMEOUT_MS,
} from "../../infra/net/undici-global-dispatcher.js";
import type { RuntimeEnv } from "../../runtime.js";

export function resolveDiscordRestFetch(
  proxyUrl: string | undefined,
  runtime: RuntimeEnv,
): typeof fetch {
  const proxy = proxyUrl?.trim();
  if (!proxy) {
    return fetch;
  }
  try {
    const agent = new ProxyAgent({
      uri: proxy,
      keepAliveTimeout: UNDICI_KEEP_ALIVE_TIMEOUT_MS,
      keepAliveMaxTimeout: UNDICI_KEEP_ALIVE_MAX_TIMEOUT_MS,
    });
    const fetcher = ((input: RequestInfo | URL, init?: RequestInit) =>
      undiciFetch(input as string | URL, {
        ...(init as Record<string, unknown>),
        dispatcher: agent,
      }) as unknown as Promise<Response>) as typeof fetch;
    runtime.log?.("discord: rest proxy enabled");
    return wrapFetchWithAbortSignal(fetcher);
  } catch (err) {
    runtime.error?.(danger(`discord: invalid rest proxy: ${String(err)}`));
    return fetch;
  }
}
