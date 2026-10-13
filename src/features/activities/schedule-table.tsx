import shared from "@/ui/data-screen.module.css";
import { type CohortCount, countParticipants } from "./participants";
import type { ScheduleRow } from "./schedule-row";
import { type CampusMoment, scheduleStatus } from "./schedule-status";
import {
  activityDetail,
  participantWords,
  shownDays,
  shownHours,
  targetWords,
  uploadWords,
} from "./schedule-words";
import { StatusBadge } from "./status-badge";

function ScheduleCells({
  schedule,
  counts,
  now,
}: {
  schedule: ScheduleRow;
  counts: CohortCount[];
  now: CampusMoment;
}) {
  const { activity } = schedule;
  const participants = countParticipants(
    counts,
    activity.semester,
    schedule.period,
  );
  return (
    <>
      <td data-title="Jadwal">
        {shownDays(schedule.startsOn, schedule.endsOn)}
        <span className={shared.detail}>
          {shownHours(schedule.startTime, schedule.endTime)}
        </span>
        <span className={shared.detail}>{uploadWords(schedule)}</span>
      </td>
      <td data-title="Kegiatan">
        <b>{activity.name}</b>
        <span className={shared.detail}>
          {activityDetail(
            schedule.location,
            schedule.isRequired,
            activity.indicatorCodes,
          )}
        </span>
      </td>
      <td data-title="Sasaran">
        {targetWords(activity.semester)}
        <span className={shared.detail}>
          {participantWords(participants, activity.targetParticipants)}
        </span>
      </td>
      <td data-title="Status">
        <StatusBadge status={scheduleStatus(schedule, now)} />
      </td>
    </>
  );
}

/**
 * The schedules of one page of the list: a table, and cards on a phone.
 * Each has "Ubah" when `onChange` is given.
 */
export function ScheduleTable({
  schedules,
  counts,
  now,
  onChange,
}: {
  schedules: ScheduleRow[];
  /** The Aktif students of each angkatan, to count the participants from. */
  counts: CohortCount[];
  /** The moment on campus the statuses are told at. */
  now: CampusMoment;
  /** Opens the form of a schedule, or null for an account that only reads. */
  onChange: ((schedule: ScheduleRow) => void) | null;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Jadwal</th>
            <th>Kegiatan</th>
            <th>Sasaran</th>
            <th>Status</th>
            {onChange && (
              <th>
                <span className={shared.hidden}>Tindakan</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => (
            <tr key={schedule.id}>
              <ScheduleCells schedule={schedule} counts={counts} now={now} />
              {onChange && (
                <td>
                  <button
                    type="button"
                    className={shared.link}
                    onClick={() => onChange(schedule)}
                  >
                    Ubah
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
