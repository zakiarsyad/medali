import shared from "@/ui/data-screen.module.css";
import styles from "./activities.module.css";
import type { BadgeLook } from "./badge-look";

const LOOK_STYLES: Record<BadgeLook, string | undefined> = {
  ok: styles.open,
  warn: styles.waiting,
  bad: styles.refused,
  plain: styles.plain,
};

/** A status in words, in the look of how it stands. */
export function LookBadge({ words, look }: { words: string; look: BadgeLook }) {
  return (
    <span className={`${shared.badge} ${LOOK_STYLES[look]}`}>{words}</span>
  );
}
