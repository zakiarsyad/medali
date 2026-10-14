"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { daysAfter } from "@/academic-periods/days-after";
import { isDay } from "@/db/is-day";
import shared from "@/ui/data-screen.module.css";
import styles from "./cleaning.module.css";
import { type CleaningParams, cleaningAddress } from "./cleaning-address";

/**
 * The date of Jadwal pembersihan: ‹ steps to the day before, › to the day
 * after, and any date can be picked in between. The dorm shown is kept.
 */
export function CleaningDaySwitch({
  params,
  today,
}: {
  params: CleaningParams;
  today: string;
}) {
  const router = useRouter();

  function addressOf(day: string): string {
    return cleaningAddress({ ...params, day, page: 1 }, today);
  }

  function open(picked: string) {
    // A date half typed is not a date yet.
    if (!isDay(picked)) return;
    router.push(addressOf(picked), { scroll: false });
  }

  return (
    <div className={styles.daySwitch}>
      <Link
        href={addressOf(daysAfter(params.day, -1))}
        className={shared.quiet}
        aria-label="Hari sebelumnya"
        scroll={false}
      >
        ‹
      </Link>
      <input
        // Made anew for each date, so it shows the date that is open.
        key={params.day}
        type="date"
        className={shared.input}
        defaultValue={params.day}
        aria-label="Tanggal"
        onChange={(event) => open(event.target.value)}
      />
      <Link
        href={addressOf(daysAfter(params.day, 1))}
        className={shared.quiet}
        aria-label="Hari berikutnya"
        scroll={false}
      >
        ›
      </Link>
    </div>
  );
}
