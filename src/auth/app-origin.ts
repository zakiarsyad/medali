import type { Stage } from "@/settings";

type ReadHeader = (name: string) => string | null;

const HOST = /^[a-z0-9.-]+(:\d{1,5})?$/i;
const KNOWN_PROTOCOLS = ["http", "https"];

function firstOf(value: string | null): string {
  return (value ?? "").split(",")[0]?.trim() ?? "";
}

function protocolOf(header: ReadHeader, stage: Stage): string {
  const passedOn = firstOf(header("x-forwarded-proto")).toLowerCase();
  if (KNOWN_PROTOCOLS.includes(passedOn)) return passedOn;
  return stage === "local" ? "http" : "https";
}

/**
 * The address the app was opened at, without a path, or null when the
 * request does not say one that can be used. The return address given to
 * Google is built from it. The host comes from the request, so its shape
 * is checked; and Google refuses a return address that is not registered.
 */
export function appOriginOf(header: ReadHeader, stage: Stage): string | null {
  const host = firstOf(header("x-forwarded-host")) || firstOf(header("host"));
  if (!HOST.test(host)) return null;
  return `${protocolOf(header, stage)}://${host.toLowerCase()}`;
}
