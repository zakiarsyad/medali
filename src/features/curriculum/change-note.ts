import { DAY } from "@/ui/day";
import type { Change } from "./change";

/**
 * The line under a panel's title that says who changed its content last,
 * or `start` while nobody has.
 */
export function changeNote(
  changed: Change | null,
  verb: "Diperbarui" | "Diatur",
  start: string,
): string {
  if (!changed) return start;
  return `${verb} ${DAY.format(changed.at)} oleh ${changed.by}.`;
}
