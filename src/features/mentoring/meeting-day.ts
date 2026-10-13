import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { shownDay } from "@/ui/day";

type PeriodDays = Pick<AcademicPeriod, "startsOn" | "endsOn">;

/** The last day "Tanggal" takes: today, or the period's last day if earlier. */
export function lastMeetingDay(period: PeriodDays, today: string): string {
  return today < period.endsOn ? today : period.endsOn;
}

/**
 * Why a meeting cannot have been held on a day, or null when it can: a
 * meeting is held on a day of the running period, today at the latest.
 */
export function meetingDayFault(
  heldOn: string,
  period: PeriodDays,
  today: string,
): string | null {
  if (heldOn > today) {
    return "Tanggal tidak boleh setelah hari ini. Pilih hari ini atau tanggal sebelumnya.";
  }
  const isInPeriod = heldOn >= period.startsOn && heldOn <= period.endsOn;
  if (!isInPeriod) {
    return `Tanggal harus dalam semester berjalan, ${shownDay(period.startsOn)} sampai ${shownDay(period.endsOn)}.`;
  }
  return null;
}
