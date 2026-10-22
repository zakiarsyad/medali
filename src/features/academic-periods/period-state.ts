import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { DAY } from "@/ui/day";
import { hasEnded } from "./change-period-dates";

/** What a period's closing tells the list: when it was closed, and how many grades it kept. */
export interface ClosingFacts {
  closedAt: Date;
  kept: number;
}

/**
 * Where a period stands on a day: not started yet, running, ended and not
 * closed, or closed. A period whose end has passed counts as ended, also
 * while the rest of the app still takes it as the running one because the
 * next has not started.
 */
export type PeriodState =
  | { kind: "upcoming" }
  | { kind: "running" }
  | { kind: "ended" }
  | ({ kind: "closed" } & ClosingFacts);

export function periodStateOf(
  period: Pick<AcademicPeriod, "startsOn" | "endsOn">,
  closing: ClosingFacts | null,
  today: string,
): PeriodState {
  if (closing) return { kind: "closed", ...closing };
  if (hasEnded(period, today)) return { kind: "ended" };
  if (period.startsOn > today) return { kind: "upcoming" };
  return { kind: "running" };
}

/** Whether a period may be closed: only once its end has passed, and once. */
export function isClosable(state: PeriodState): boolean {
  return state.kind === "ended";
}

/** The state as the list of periods says it. */
export function stateWords(state: PeriodState): string {
  if (state.kind === "upcoming") return "Belum dimulai";
  if (state.kind === "running") return "Berjalan";
  if (state.kind === "ended") return "Selesai, belum ditutup";
  return `Ditutup ${DAY.format(state.closedAt)} · ${state.kept} nilai ditetapkan`;
}
