import shared from "@/ui/data-screen.module.css";
import type { OwnSiku } from "./own-siku";
import styles from "./siku.module.css";
import { SikuBreakdown } from "./siku-breakdown";
import { GAIN_REASONS, LOSS_REASONS } from "./siku-ids";
import { REASON_WORDS } from "./siku-words";

/** How many lines a table shows before the rest is folded. */
const FOLD_AFTER = 10;

const LOSS_WORDS = LOSS_REASONS.map((reason) =>
  REASON_WORDS[reason].toLowerCase(),
).join("; ");

/**
 * "Transparansi nilai SIKU" of a student's own, in Penilaian SIKU and on
 * Profil saya: the weight of SIKU in the character grade, how SIKU akhir
 * is reached, each gain and loss with the role that entered it, and,
 * folded, what can add to or reduce SIKU and who to ask about a line.
 */
export function OwnSikuPanel({
  base,
  weight,
  siku,
}: {
  base: number;
  /** The weight of SIKU in the grade scheme in force. */
  weight: number;
  siku: OwnSiku;
}) {
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>Transparansi nilai SIKU</h2>
        <span className={shared.detail}>
          bobot {weight}% pada nilai karakter
        </span>
      </div>
      <SikuBreakdown
        base={base}
        totals={siku.totals}
        lines={siku.entries}
        foldAfter={FOLD_AFTER}
      />
      <details className={styles.spaced}>
        <summary className={shared.link}>
          Kegiatan yang dapat menambah nilai SIKU
        </summary>
        <ul className={styles.list}>
          {GAIN_REASONS.map((reason) => (
            <li key={reason}>{REASON_WORDS[reason]}</li>
          ))}
        </ul>
        <p className={styles.sub}>
          Pengurangan dapat terjadi karena: {LOSS_WORDS}. Bila ada catatan yang
          menurut Anda keliru, hubungi pengasuh atau Penilai Mahasiswa.
        </p>
      </details>
    </section>
  );
}
