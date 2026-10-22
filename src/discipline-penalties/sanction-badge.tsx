import shared from "@/ui/data-screen.module.css";
import { SANCTION_WORDS, type Sanction } from "./sanction";
import styles from "./sanction-badge.module.css";

/** "Diberhentikan sementara", "Diberhentikan permanen" or "Diberhentikan (ayat 8)". */
export function SanctionBadge({ sanction }: { sanction: Sanction }) {
  return (
    <span className={`${shared.badge} ${styles.sanction}`}>
      {SANCTION_WORDS[sanction]}
    </span>
  );
}
