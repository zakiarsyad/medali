import { toneBadge } from "@/ui/tone-badge";
import { SANCTION_WORDS, type Sanction } from "./sanction";

/**
 * "Diberhentikan sementara", "Diberhentikan permanen" or "Diberhentikan
 * (ayat 8)", in the solid red of a Berat penalty.
 */
export function SanctionBadge({ sanction }: { sanction: Sanction }) {
  return (
    <span className={toneBadge("severe")}>{SANCTION_WORDS[sanction]}</span>
  );
}
