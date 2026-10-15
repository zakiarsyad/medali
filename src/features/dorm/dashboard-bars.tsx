import { DORM_IDS, DORM_NAMES, type DormId } from "@/dorms/dorms";
import shared from "@/ui/data-screen.module.css";
import type { ResidentsByDorm } from "./activity-audience";
import { ORGANISERS, type Organiser } from "./activity-ids";
import { ORGANISER_NAMES } from "./activity-words";
import board from "./dashboard.module.css";
import type { CountedAttendance } from "./dashboard-lines";
import type { Attendance } from "./dashboard-tally";
import { type BarFill, rateBar } from "./dashboard-words";

export const NO_ANNOUNCED = "Belum ada kegiatan yang diumumkan.";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** One bar: what it counts, a line in brackets, how far it is filled, and its value. */
export interface Bar extends BarFill {
  key: string;
  label: string;
  /** The line in brackets after the label, when there is one. */
  note?: string;
}

/**
 * Bars, each as wide as its share. A meter shows the share, so no width
 * is written into the screen code.
 */
export function Bars({ bars, gold = false }: { bars: Bar[]; gold?: boolean }) {
  const meter = gold ? `${board.meter} ${board.gold}` : board.meter;
  return (
    <ul className={board.bars}>
      {bars.map((bar) => (
        <li key={bar.key} className={board.bar}>
          <span className={board.barLabel}>
            {bar.label}{" "}
            {bar.note !== undefined && (
              <span className={board.sub}>({bar.note})</span>
            )}
          </span>
          <meter
            className={meter}
            min={0}
            max={1}
            value={bar.share}
            aria-label={bar.label}
          />
          <span className={board.barValue}>{bar.words}</span>
        </li>
      ))}
    </ul>
  );
}

function organiserBar(organiser: Organiser, counted: CountedAttendance): Bar {
  return {
    key: organiser,
    label: ORGANISER_NAMES[organiser],
    note: shown(counted.activities),
    ...rateBar(counted.attendance),
  };
}

function dormBar(
  dorm: DormId,
  attendance: Attendance,
  residents: ResidentsByDorm,
): Bar {
  return {
    key: dorm,
    label: DORM_NAMES[dorm],
    note: `${shown(residents[dorm])} penghuni`,
    ...rateBar(attendance),
  };
}

/**
 * Kehadiran per penanggung jawab, with the number of announced activities
 * of each, and Kehadiran per asrama, with the residents of each dorm. A
 * bar with nothing counted shows "-" instead of 0%.
 */
export function AttendanceBars({
  byOrganiser,
  byDorm,
  residents,
  activities,
}: {
  byOrganiser: Record<Organiser, CountedAttendance>;
  byDorm: Record<DormId, Attendance>;
  residents: ResidentsByDorm;
  /** How many announced activities are counted in all. */
  activities: number;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Kehadiran per penanggung jawab</h2>
      {activities === 0 && <p className={board.none}>{NO_ANNOUNCED}</p>}
      <Bars
        bars={ORGANISERS.map((organiser) =>
          organiserBar(organiser, byOrganiser[organiser]),
        )}
      />
      <h3 className={board.subheading}>Kehadiran per asrama</h3>
      <Bars
        gold
        bars={DORM_IDS.map((dorm) => dormBar(dorm, byDorm[dorm], residents))}
      />
    </section>
  );
}
