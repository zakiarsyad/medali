import Link from "next/link";
import { daysAfter } from "@/academic-periods/days-after";
import { isDay } from "@/db/is-day";
import shared from "@/ui/data-screen.module.css";
import { usePageMove } from "@/ui/page-move";
import styles from "./activities.module.css";
import { activitiesAddress } from "./activities-address";

/**
 * The day of Jadwal harian: ‹ steps to the day before, › to the day
 * after, and any day can be picked in between. A day picked while
 * `leaveQuestion` is given is opened only when the person agrees; the
 * links ask by themselves, as every link of a form that is not saved does.
 */
export function DaySwitch({
  day,
  today,
  leaveQuestion,
}: {
  day: string;
  today: string;
  /** What is asked before another day opens, or null to ask nothing. */
  leaveQuestion: string | null;
}) {
  const router = usePageMove();

  function addressOf(shown: string): string {
    return activitiesAddress(
      { view: "harian", day: shown, page: 1, counted: null },
      today,
    );
  }

  function open(field: HTMLInputElement) {
    const picked = field.value;
    // A day half typed is not a day yet.
    if (!isDay(picked)) return;
    if (leaveQuestion !== null && !window.confirm(leaveQuestion)) {
      field.value = day;
      return;
    }
    router.push(addressOf(picked), { scroll: false });
  }

  return (
    <div className={styles.daySwitch}>
      <Link
        href={addressOf(daysAfter(day, -1))}
        className={shared.quiet}
        aria-label="Hari sebelumnya"
        scroll={false}
      >
        ‹
      </Link>
      <input
        // Made anew for each day, so it shows the day that is open.
        key={day}
        type="date"
        className={shared.input}
        defaultValue={day}
        aria-label="Tanggal"
        onChange={(event) => open(event.target)}
      />
      <Link
        href={addressOf(daysAfter(day, 1))}
        className={shared.quiet}
        aria-label="Hari berikutnya"
        scroll={false}
      >
        ›
      </Link>
    </div>
  );
}
