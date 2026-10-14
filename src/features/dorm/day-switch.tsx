import Link from "next/link";
import { useRouter } from "next/navigation";
import { daysAfter } from "@/academic-periods/days-after";
import { isDay } from "@/db/is-day";
import shared from "@/ui/data-screen.module.css";
import styles from "./activities.module.css";
import { activitiesAddress } from "./activities-address";

/**
 * The day of Jadwal harian: ‹ steps to the day before, › to the day
 * after, and any day can be picked in between.
 */
export function DaySwitch({ day, today }: { day: string; today: string }) {
  const router = useRouter();

  function addressOf(shown: string): string {
    return activitiesAddress({ view: "harian", day: shown, page: 1 }, today);
  }

  function open(picked: string) {
    // A day half typed is not a day yet.
    if (isDay(picked)) router.push(addressOf(picked), { scroll: false });
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
        onChange={(event) => open(event.target.value)}
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
