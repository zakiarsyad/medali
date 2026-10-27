import { LevelBadges } from "@/mental-health/screening-badges";
import { INSTRUMENT_WORDS } from "@/mental-health/screening-words";
import { NOT_SCREENED } from "@/mental-health/shared-words";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { toneBadge } from "@/ui/tone-badge";
import styles from "./counselling.module.css";
import type { ShownScreening, StudentMental } from "./student-mental";

/** The mark of a panel a recipient sees through a sharing. */
export const PUBLISHED_MARK = "Dipublikasikan konselor";

/**
 * The instrument, day and advice of the latest screening, as Konselor and
 * the student read it, or that there is none.
 */
export function ScreeningLine({
  screening,
}: {
  screening: ShownScreening | null;
}) {
  if (screening === null) {
    return (
      <p className={shared.emptySection}>Belum ada asesmen kesehatan mental.</p>
    );
  }
  return (
    <p className={styles.sub}>
      Asesmen {INSTRUMENT_WORDS[screening.instrument]} pada{" "}
      {shownDay(screening.screenedOn)}. Rekomendasi: {screening.advice}.
    </p>
  );
}

function SharedBody({ screening }: { screening: ShownScreening | null }) {
  if (screening === null) {
    return <p className={shared.emptySection}>{NOT_SCREENED}.</p>;
  }
  return (
    <>
      <p>
        <b>Tingkat asesmen terakhir:</b>{" "}
        <LevelBadges level={screening.level} risk={false} />{" "}
        {INSTRUMENT_WORDS[screening.instrument]},{" "}
        {shownDay(screening.screenedOn)}
      </p>
      <p>
        <b>Rekomendasi:</b> {screening.advice}
      </p>
    </>
  );
}

function HeadBadge({ mental }: { mental: StudentMental }) {
  if (mental.kind === "shared") {
    return <span className={toneBadge("good")}>{PUBLISHED_MARK}</span>;
  }
  if (mental.screening === null) return null;
  return <LevelBadges level={mental.screening.level} risk={false} />;
}

/**
 * "Kesehatan mental" in a student's detail: for Konselor the level of
 * the latest screening with its instrument, date and advice; for a
 * recipient the same as the sharing holds it, marked "Dipublikasikan
 * konselor". Never the "Risiko" mark.
 */
export function StudentMentalView({ mental }: { mental: StudentMental }) {
  return (
    <section className={`${shared.panel} ${styles.stack}`}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>Kesehatan mental</h2>
        <span>
          <HeadBadge mental={mental} />
        </span>
      </div>
      {mental.kind === "shared" ? (
        <SharedBody screening={mental.screening} />
      ) : (
        <ScreeningLine screening={mental.screening} />
      )}
    </section>
  );
}
