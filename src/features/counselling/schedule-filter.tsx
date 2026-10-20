"use client";

import { useRouter } from "next/navigation";
import shared from "@/ui/data-screen.module.css";
import {
  FILTER_ORDER,
  FILTER_WORDS,
  filterName,
  filterNamed,
  type ScheduleFilter,
  scheduleListAddress,
} from "./schedule-address";

/** The Status filter above the request cards, kept in the address. */
export function ScheduleFilterRow({ filter }: { filter: ScheduleFilter }) {
  const router = useRouter();
  return (
    <div className={shared.filters}>
      <select
        className={shared.input}
        aria-label="Status"
        value={filterName(filter)}
        onChange={(event) =>
          router.push(scheduleListAddress(filterNamed(event.target.value)))
        }
      >
        {FILTER_ORDER.map((choice) => (
          <option key={choice} value={filterName(choice)}>
            {FILTER_WORDS[choice]}
          </option>
        ))}
      </select>
    </div>
  );
}
