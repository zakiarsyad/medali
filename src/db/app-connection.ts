import { isPreview, type Stage } from "@/settings";
import type { PoolLimits } from "./connect";

/**
 * The hosting runs many short-lived copies of the app at once. With ten
 * connections each, kept open while idle, they ran the free database out
 * of connections, and every page failed until the idle copies went away.
 */
const PREVIEW_LIMITS: PoolLimits = { max: 5, idleTimeoutSeconds: 10 };

export interface AppConnection {
  url: string;
  limits?: PoolLimits;
}

/**
 * Where the app's own connection goes. The campus server runs one copy
 * all the time, so it keeps the defaults.
 */
export function appConnectionOf(url: string, stage: Stage): AppConnection {
  if (!isPreview(stage)) return { url };
  return { url: sharedConnectionAddress(url), limits: PREVIEW_LIMITS };
}

/**
 * The address through which many copies share a few real connections.
 * The database service names it by adding "-pooler" to the endpoint, the
 * first part of its own address.
 */
export function sharedConnectionAddress(url: string): string {
  const address = new URL(url);
  const [endpoint = "", ...rest] = address.hostname.split(".");
  const atDatabaseService =
    address.hostname.endsWith(".neon.tech") && endpoint.startsWith("ep-");
  if (!atDatabaseService || endpoint.endsWith("-pooler")) return url;
  address.hostname = [`${endpoint}-pooler`, ...rest].join(".");
  return address.href;
}
