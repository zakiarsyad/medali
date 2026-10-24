import type { ReactNode } from "react";
import type { BadgeTone } from "./badge-tone";
import shared from "./data-screen.module.css";

/**
 * The classes of a status badge in the colours of its tone, or of the
 * gold badge for a status that has no colour of its own.
 */
export function toneBadge(tone: BadgeTone | null): string | undefined {
  if (tone === null) return shared.badge;
  return `${shared.badge} ${shared[tone]}`;
}

/** A status in its words, in the colours of its tone. */
export function ToneBadge({
  tone,
  children,
}: {
  tone: BadgeTone;
  children: ReactNode;
}) {
  return <span className={toneBadge(tone)}>{children}</span>;
}
