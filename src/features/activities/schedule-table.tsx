import Link from "next/link";
import { Fragment } from "react";
import type { CampusMoment } from "@/academic-periods/campus-clock";
import shared from "@/ui/data-screen.module.css";
import { AbsentPanel } from "./absent-panel";
import { type CohortCount, countParticipants } from "./participants";
import {
  type AttendanceCount,
  hasStarted,
  type ListAttendance,
  shownAttendance,
} from "./schedule-attendance";
import type { OpenAbsent } from "./schedule-list-address";
import type { ScheduleRow } from "./schedule-row";
import { scheduleStatus } from "./schedule-status";
import {
  activityDetail,
  participantWords,
  shownCount,
  shownDays,
  shownHours,
  targetWords,
  uploadWords,
} from "./schedule-words";
import { StatusBadge } from "./status-badge";

/** The cells before the attendance, and the actions, count as columns too. */
const COLUMNS = 8;

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

/** Hadir, Menunggu and Kehadiran: nobody yet before the schedule starts. */
function AttendanceCells({ count }: { count: AttendanceCount | undefined }) {
  return (
    <>
      <td data-title="Hadir">{shownCount(count?.present ?? 0)}</td>
      <td data-title="Menunggu">{shownCount(count?.waiting ?? 0)}</td>
      <td data-title="Kehadiran">{shownAttendance(count)}</td>
    </>
  );
}

/** The first page of the students of a schedule. */
function first(scheduleId: string): OpenAbsent {
  return { scheduleId, page: 1 };
}

/**
 * What a row offers: "Peserta", or "Tutup" while it is open, and "Ubah".
 * A row that offers nothing draws nothing, so its cell takes no room.
 */
function RowActions({
  absentAddress,
  isOpen,
  onChange,
}: {
  /** Where "Peserta" or "Tutup" leads, or null before the schedule starts. */
  absentAddress: string | null;
  isOpen: boolean;
  onChange: (() => void) | null;
}) {
  if (absentAddress === null && onChange === null) return null;
  return (
    <span className={shared.rowActions}>
      {absentAddress !== null && (
        // The list stays where it is scrolled to: the students open under their row.
        <Link href={absentAddress} className={shared.link} scroll={false}>
          {isOpen ? "Tutup" : "Peserta"}
        </Link>
      )}
      {onChange && (
        <button type="button" className={shared.link} onClick={onChange}>
          Ubah
        </button>
      )}
    </span>
  );
}

/**
 * The schedules of one page of the list: a table, and cards on a phone.
 * Each shows how many attended. From its first day on a schedule has
 * "Peserta", which opens the students who did not attend under it, and
 * "Tutup" closes them again. Each has "Ubah" when `onChange` is given.
 */
export function ScheduleTable({
  schedules,
  counts,
  now,
  attendance,
  addressOf,
  onChange,
}: {
  schedules: ScheduleRow[];
  /** The Aktif students of each angkatan, to count the participants from. */
  counts: CohortCount[];
  /** The moment on campus the statuses are told at. */
  now: CampusMoment;
  attendance: ListAttendance;
  /** The address of this page of the list with a "Peserta" open, or none. */
  addressOf: (open: OpenAbsent | null) => string;
  /** Opens the form of a schedule, or null for an account that only reads. */
  onChange: ((schedule: ScheduleRow) => void) | null;
}) {
  const { absent } = attendance;
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Jadwal</th>
            <th>Kegiatan</th>
            <th>Sasaran</th>
            <th>Status</th>
            <th>Hadir</th>
            <th>Menunggu</th>
            <th>Kehadiran</th>
            <th>
              <span className={shared.hidden}>Tindakan</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => {
            const { id } = schedule;
            const isOpen = absent?.scheduleId === id;
            return (
              <Fragment key={id}>
                <tr>
                  <ScheduleCells
                    schedule={schedule}
                    counts={counts}
                    now={now}
                  />
                  <AttendanceCells count={attendance.counts[id]} />
                  <td>
                    <RowActions
                      absentAddress={
                        hasStarted(schedule, now.day)
                          ? addressOf(isOpen ? null : first(id))
                          : null
                      }
                      isOpen={isOpen}
                      onChange={onChange && (() => onChange(schedule))}
                    />
                  </td>
                </tr>
                {absent !== null && isOpen && (
                  <tr>
                    <td colSpan={COLUMNS}>
                      <AbsentPanel
                        absent={absent}
                        addressOf={(page) =>
                          addressOf({ scheduleId: id, page })
                        }
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
