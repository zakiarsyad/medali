import Link from "next/link";
import { rerataOf, type Scores } from "@/character-scores/assessment-score";
import {
  strongestValueOf,
  weakestValueOf,
} from "@/character-scores/coaching-need";
import { Medal } from "@/character-scores/medal";
import { PredicateBadge } from "@/character-scores/predicate-badge";
import { NOT_ASSESSED } from "@/character-scores/predicate-words";
import { shownRerata } from "@/character-scores/shown-rerata";
import {
  kindWords,
  type PenaltyKind,
} from "@/discipline-penalties/penalty-kinds";
import { CHARACTER_SCORE_CAP } from "@/discipline-penalties/score-limit";
import shared from "@/ui/data-screen.module.css";
import { DAY } from "@/ui/day";
import { LimitNote } from "@/ui/limit-note";
import { type ValueKey, valueNameOf } from "@/ui/medali-values";
import { pickAddress } from "./assessment-address";
import { SOURCE_WORDS } from "./assessment-words";
import styles from "./character-assessment.module.css";
import type { StudentAchievement } from "./student-achievement";

function titleOf(semester: number | null): string {
  if (semester === null) return "Capaian karakter";
  return `Capaian karakter semester ${semester}`;
}

function NotAssessed({ achievement }: { achievement: StudentAchievement }) {
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>{titleOf(achievement.semester)}</h2>
        <span className={shared.badge}>{NOT_ASSESSED}</span>
      </div>
      <p className={shared.emptySection}>
        Belum ada hasil asesmen karakter semester ini.
        {!achievement.own &&
          " Capaian MEDALI tampil setelah asesmen diinput di Penilaian > Asesmen karakter."}
      </p>
      {achievement.mayAssess && (
        <Link
          className={shared.quiet}
          href={pickAddress(achievement.studentId)}
        >
          Input asesmen
        </Link>
      )}
    </section>
  );
}

function ValueAndScore({ scores, value }: { scores: Scores; value: ValueKey }) {
  return (
    <>
      <b>{valueNameOf(value)}</b> ({scores[value]})
    </>
  );
}

/**
 * The strongest and the weakest value. `beforeLimit` says the scores are
 * the stored ones above the limit, which only the student is given.
 */
function Standouts({
  scores,
  withEarlier,
  beforeLimit,
}: {
  scores: Scores;
  withEarlier: boolean;
  beforeLimit: boolean;
}) {
  return (
    <p className={styles.sub}>
      {beforeLimit ? "Sebelum pembatasan, paling" : "Paling"} menonjol pada{" "}
      <ValueAndScore scores={scores} value={strongestValueOf(scores)} />. Perlu
      perhatian pada{" "}
      <ValueAndScore scores={scores} value={weakestValueOf(scores)} />.
      {withEarlier && " Garis putus-putus menunjukkan semester lalu."}
    </p>
  );
}

/** Why the scores of a student under a Ringan or Sedang penalty are held at 70. */
function limitNoteOf(limit: PenaltyKind, storedRerata: number): string {
  return `Nilai semester ini dibatasi paling tinggi ${CHARACTER_SCORE_CAP} karena hukuman disiplin ${kindWords(limit)}. Rerata sebelum pembatasan ${shownRerata(storedRerata)}.`;
}

/**
 * "Capaian karakter" in a student's detail: the medal of the latest
 * assessment over the one before it, its Rerata, predikat, source and
 * date, and the strongest and the weakest value. A student never
 * assessed gets a line saying so, and "Input asesmen" where the account
 * may assess them. Under a Ringan or Sedang penalty the scores are held
 * at 70, with a note saying why and the Rerata as stored; the single
 * scores as stored are not shown, except on the student's own card,
 * where they name the strongest and the weakest value.
 */
export function StudentAchievementView({
  achievement,
}: {
  achievement: StudentAchievement;
}) {
  const { latest, earlier } = achievement;
  if (latest === null) return <NotAssessed achievement={achievement} />;
  const rerata = rerataOf(latest.scores);
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>{titleOf(achievement.semester)}</h2>
        <span>
          <PredicateBadge rerata={rerata} /> Rerata {shownRerata(rerata)}
        </span>
      </div>
      <p className={styles.sub}>
        Hasil asesmen {SOURCE_WORDS[latest.source]}{" "}
        {DAY.format(latest.enteredAt)}.
      </p>
      {achievement.limit && (
        <LimitNote text={limitNoteOf(achievement.limit, latest.storedRerata)} />
      )}
      <Medal scores={latest.scores} last={earlier} />
      <Standouts
        scores={achievement.stored ?? latest.scores}
        withEarlier={earlier !== null}
        beforeLimit={achievement.stored !== undefined}
      />
    </section>
  );
}
