import type { BadgeTone } from "@/ui/badge-tone";
import { DAY } from "@/ui/day";
import { toneBadge } from "@/ui/tone-badge";
import type { ConsentStatus } from "./consent-ids";
import type { ConsentView } from "./consent-view";
import { NOT_ASKED_WORDS, STATUS_WORDS, WAY_WORDS } from "./consent-words";
import styles from "./counselling.module.css";

/** The colours of the prototype: waits, given, declined, taken back. */
const STATUS_TONES: Record<ConsentStatus, BadgeTone> = {
  waiting: "warning",
  approved: "good",
  declined: "bad",
  withdrawn: "plain",
};

/** A consent's status, or Belum diminta for a student never asked. */
export function ConsentBadge({ status }: { status: ConsentStatus | null }) {
  if (status === null) {
    return <span className={toneBadge("plain")}>{NOT_ASKED_WORDS}</span>;
  }
  return (
    <span className={toneBadge(STATUS_TONES[status])}>
      {STATUS_WORDS[status]}
    </span>
  );
}

/**
 * The status with how a Disetujui was given, its date, and the Konselor
 * who asked or recorded it where the consent names one.
 */
export function ConsentStatusLine({
  consent,
}: {
  consent: ConsentView | null;
}) {
  const parts: string[] = [];
  if (consent?.way) parts.push(WAY_WORDS[consent.way]);
  if (consent) parts.push(DAY.format(consent.changedAt));
  if (consent?.counsellorName) parts.push(consent.counsellorName);
  return (
    <p className={styles.status}>
      <ConsentBadge status={consent?.status ?? null} />
      {parts.length > 0 && (
        <span className={styles.sub}>{parts.join(" · ")}</span>
      )}
    </p>
  );
}
