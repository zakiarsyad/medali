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
import shared from "@/ui/data-screen.module.css";
import { DAY } from "@/ui/day";
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
      <p className={styles.sub}>
        Belum ada hasil asesmen karakter semester ini. Capaian MEDALI tampil
        setelah asesmen diinput di Penilaian &gt; Asesmen karakter.
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

function Standouts({
  scores,
  withEarlier,
}: {
  scores: Scores;
  withEarlier: boolean;
}) {
  return (
    <p className={styles.sub}>
      Paling menonjol pada{" "}
      <ValueAndScore scores={scores} value={strongestValueOf(scores)} />. Perlu
      perhatian pada{" "}
      <ValueAndScore scores={scores} value={weakestValueOf(scores)} />.
      {withEarlier && " Garis putus-putus menunjukkan semester lalu."}
    </p>
  );
}

/**
 * "Capaian karakter" in a student's detail: the medal of the latest
 * assessment over the one before it, its Rerata, predikat, source and
 * date, and the strongest and the weakest value. A student never
 * assessed gets a line saying so, and "Input asesmen" where the account
 * may assess them.
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
      <Medal scores={latest.scores} last={earlier} />
      <Standouts scores={latest.scores} withEarlier={earlier !== null} />
    </section>
  );
}
