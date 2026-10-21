"use client";

import { useRouter } from "next/navigation";
import shared from "@/ui/data-screen.module.css";
import {
  FILTER_ORDER,
  FILTER_WORDS,
  filterName,
  filterNamed,
  kindName,
  kindNamed,
  type ScheduleFilter,
  scheduleListAddress,
} from "./schedule-address";
import { SCHEDULE_KINDS, type ScheduleKind } from "./schedule-ids";
import { KIND_WORDS } from "./schedule-words";

/** The Status and Jenis filters above the request cards, kept in the address. */
export function ScheduleFilterRow({
  filter,
  kind,
}: {
  filter: ScheduleFilter;
  kind: ScheduleKind | null;
}) {
  const router = useRouter();
  return (
    <div className={shared.filters}>
      <select
        className={shared.input}
        aria-label="Status"
        value={filterName(filter)}
        onChange={(event) =>
          router.push(
            scheduleListAddress(filterNamed(event.target.value), 1, kind),
          )
        }
      >
        {FILTER_ORDER.map((choice) => (
          <option key={choice} value={filterName(choice)}>
            {FILTER_WORDS[choice]}
          </option>
        ))}
      </select>
      <select
        className={shared.input}
        aria-label="Jenis"
        value={kindName(kind)}
        onChange={(event) =>
          router.push(
            scheduleListAddress(filter, 1, kindNamed(event.target.value)),
          )
        }
      >
        <option value="">Semua jenis</option>
        {SCHEDULE_KINDS.map((choice) => (
          <option key={choice} value={kindName(choice)}>
            {KIND_WORDS[choice]}
          </option>
        ))}
      </select>
    </div>
  );
}
