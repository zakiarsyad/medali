import { shownDay } from "@/ui/day";
import { NumberCard, NumberCards, WordsCard } from "@/ui/number-cards";
import { scoreNote, shownScore } from "./attendance-score";
import type { StudentActivities } from "./student-activities";
import type { StudentSchedule } from "./student-schedule";

function NextActivity({ next }: { next: StudentSchedule | undefined }) {
  if (next === undefined) {
    return <WordsCard label="Kegiatan berikutnya" words="-" />;
  }
  return (
    <WordsCard
      label="Kegiatan berikutnya"
      words={next.name}
      note={shownDay(next.startsOn)}
    />
  );
}

/** The four numbers above the student's activities. */
export function StudentNumbers({
  activities,
}: {
  activities: Pick<
    StudentActivities,
    "score" | "waiting" | "dispensations" | "coming"
  >;
}) {
  const { score, waiting, dispensations, coming } = activities;
  return (
    <NumberCards>
      <NumberCard
        label="Nilai kehadiran kegiatan"
        amount={shownScore(score)}
        note={scoreNote(score)}
      />
      <NumberCard
        label="Menunggu verifikasi"
        amount={waiting}
        note="foto terunggah"
      />
      <NumberCard
        label="Dispensasi"
        amount={dispensations}
        note="izin atau sakit, tidak dihitung"
      />
      <NextActivity next={coming[0]} />
    </NumberCards>
  );
}
