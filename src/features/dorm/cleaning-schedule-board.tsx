"use client";

import { type FormEvent, type ReactNode, useState, useTransition } from "react";
import { DORM_NAMES, DORM_SHORT_NAMES, type DormId } from "@/dorms/dorms";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { ListPager } from "@/ui/list-pager";
import { dayWords } from "./activity-words";
import { ChangeButton } from "./change-button";
import styles from "./cleaning.module.css";
import {
  assignOwnRoomsAction,
  assignPlaceDutyAction,
  cancelDutyAction,
} from "./cleaning-actions";
import { type CleaningParams, cleaningAddress } from "./cleaning-address";
import { type DutyRights, offersOf } from "./cleaning-assessment";
import {
  AssessmentCell,
  CleaningStatusBadge,
  RepeatBadge,
} from "./cleaning-duty-parts";
import { OWN_ROOM_PAGE_SIZE } from "./cleaning-ids";
import { CleaningJudgeForm } from "./cleaning-judge-form";
import { NOT_PLOTTED } from "./cleaning-messages";
import type { OccupiedRoom } from "./cleaning-rooms";
import {
  offeredRoomWords,
  ownRoomWords,
  type PlaceRow,
  residentsOf,
  roomWords,
} from "./cleaning-rows";
import type { OwnRoomPage, ScheduledDuty } from "./cleaning-schedule";
import { CleaningValidateButtons } from "./cleaning-validate-buttons";

type OnSaid = (text: string) => void;

/** What one dorm's part of the schedule needs to know. */
export interface ScheduleScope {
  dorm: DormId;
  params: CleaningParams;
  today: string;
  rooms: OccupiedRoom[];
  /** Whether the account may give and cancel duties on the date shown. */
  mayChange: boolean;
  /** What the account may do with duties. */
  rights: DutyRights;
}

/** Whether the schedule has a column of buttons for the account. */
function hasActions(scope: ScheduleScope): boolean {
  return scope.mayChange || scope.rights.judge || scope.rights.validate;
}

function AssignForm({
  placeId,
  scope,
  onSaid,
}: {
  placeId: string;
  scope: ScheduleScope;
  onSaid: OnSaid;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startSending] = useTransition();

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const roomId = new FormData(event.currentTarget).get("roomId");
    startSending(async () => {
      const after = await assignPlaceDutyAction(
        placeId,
        typeof roomId === "string" ? roomId : "",
        scope.params.day,
      );
      setError(after.error);
      if (after.done) onSaid(after.done);
    });
  }

  return (
    <form onSubmit={send} className={styles.assign} noValidate>
      <select
        name="roomId"
        className={shared.input}
        defaultValue=""
        aria-label="Kamar bertugas"
      >
        <option value="">Pilih kamar bertugas…</option>
        {scope.rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {offeredRoomWords(room)}
          </option>
        ))}
      </select>
      <button type="submit" className={shared.button} disabled={pending}>
        Tugaskan
      </button>
      <FormMessage state={{ error, done: null }} />
    </form>
  );
}

function RoomCell({
  duty,
  rooms,
}: {
  duty: ScheduledDuty;
  rooms: OccupiedRoom[];
}) {
  const residents = residentsOf(duty, rooms);
  return (
    <td data-title="Kamar bertugas">
      {roomWords(duty.roomNumber)}
      {residents !== null && (
        <small className={shared.detail}>
          {residents.toLocaleString("id-ID")} penghuni
        </small>
      )}
    </td>
  );
}

function DutyRow({
  label,
  duty,
  scope,
  onSaid,
}: {
  /** The place, or the room's own room. */
  label: string;
  duty: ScheduledDuty;
  scope: ScheduleScope;
  onSaid: OnSaid;
}) {
  const question = `Batalkan tugas ${roomWords(duty.roomNumber)} untuk ${label} pada ${dayWords(scope.params.day)}?`;
  const offers = offersOf(duty, scope.params.day, scope.today, scope.rights);
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Tempat">
        <b>{label}</b> {duty.isRepeat && <RepeatBadge />}
      </td>
      <RoomCell duty={duty} rooms={scope.rooms} />
      <td data-title="Status">
        <CleaningStatusBadge status={duty.status} />
      </td>
      <AssessmentCell duty={duty} />
      {hasActions(scope) && (
        <td className={shared.rowActions}>
          {offers.judge && (
            <CleaningJudgeForm dutyId={duty.id} onSaid={onSaid} />
          )}
          {offers.validate && (
            <CleaningValidateButtons dutyId={duty.id} onSaid={onSaid} />
          )}
          {offers.cancel && (
            <ChangeButton
              send={() => cancelDutyAction(duty.id)}
              question={question}
              look={shared.danger}
              onDone={onSaid}
            >
              Batalkan tugas
            </ChangeButton>
          )}
        </td>
      )}
    </tr>
  );
}

function EmptyRow({
  row,
  scope,
  onSaid,
}: {
  row: PlaceRow;
  scope: ScheduleScope;
  onSaid: OnSaid;
}) {
  const mayAssign = scope.mayChange && scope.rooms.length > 0;
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Tempat">
        <b>{row.place.name}</b>
      </td>
      <td data-title="Kamar bertugas">
        {mayAssign ? (
          <AssignForm placeId={row.place.id} scope={scope} onSaid={onSaid} />
        ) : (
          <span className={styles.quiet}>Belum ada kamar bertugas</span>
        )}
      </td>
      <td data-title="Status" />
      <td data-title="Penilaian" />
      {hasActions(scope) && <td />}
    </tr>
  );
}

function ScheduleTable({
  scope,
  children,
}: {
  scope: ScheduleScope;
  children: ReactNode;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Tempat</th>
            <th>Kamar bertugas</th>
            <th>Status</th>
            <th>Penilaian</th>
            {hasActions(scope) && (
              <th>
                <span className={shared.hidden}>Tindakan</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function OwnRoomsLine({
  scope,
  scheduledRooms,
  onSaid,
}: {
  scope: ScheduleScope;
  scheduledRooms: number;
  onSaid: OnSaid;
}) {
  const { dorm, params, rooms } = scope;
  const waiting = rooms.length - scheduledRooms;
  const question =
    waiting > 0
      ? `Tugaskan ${waiting.toLocaleString("id-ID")} kamar membersihkan kamarnya sendiri pada ${dayWords(params.day)}?`
      : null;
  return (
    <div className={styles.ownLine}>
      {scope.mayChange && (
        <ChangeButton
          send={() => assignOwnRoomsAction(dorm, params.day)}
          question={question}
          look={shared.link}
          onDone={onSaid}
        >
          {`Tugaskan semua kamar ${DORM_SHORT_NAMES[dorm]} membersihkan kamarnya sendiri`}
        </ChangeButton>
      )}
      <span className={styles.quiet}>
        ({scheduledRooms.toLocaleString("id-ID")} dari{" "}
        {rooms.length.toLocaleString("id-ID")} kamar sudah dijadwalkan)
      </span>
    </div>
  );
}

/**
 * One dorm's part of Jadwal pembersihan on the date shown: each place with
 * the room that cleans it, and the rooms that clean their own room, a page
 * at a time, each with where it stands and its judgement. For an account
 * that may change them, on today or a later date, the forms that give and
 * cancel duties, and for one that may judge or validate, the buttons to
 * do so. What a change says stays here, as the row it was made on changes
 * with it.
 */
export function CleaningScheduleBoard({
  scope,
  rows,
  ownRooms,
  scheduledRooms,
}: {
  scope: ScheduleScope;
  rows: PlaceRow[];
  ownRooms: OwnRoomPage;
  scheduledRooms: number;
}) {
  const [said, setSaid] = useState<string | null>(null);
  const { dorm, params, today } = scope;
  const isPlotted = scope.rooms.length > 0;
  return (
    <section className={styles.dormSchedule} aria-label={DORM_NAMES[dorm]}>
      <h3 className={styles.dormTitle}>{DORM_NAMES[dorm]}</h3>
      {!isPlotted && <p className={styles.note}>{NOT_PLOTTED}</p>}
      {said && (
        <p className={shared.done} role="status">
          {said}
        </p>
      )}
      {rows.length === 0 ? (
        <p className={styles.quiet}>Belum ada tempat.</p>
      ) : (
        <ScheduleTable scope={scope}>
          {rows.map((row) =>
            row.duty ? (
              <DutyRow
                key={row.place.id}
                label={row.place.name}
                duty={row.duty}
                scope={scope}
                onSaid={setSaid}
              />
            ) : (
              <EmptyRow
                key={row.place.id}
                row={row}
                scope={scope}
                onSaid={setSaid}
              />
            ),
          )}
        </ScheduleTable>
      )}
      {isPlotted && (
        <OwnRoomsLine
          scope={scope}
          scheduledRooms={scheduledRooms}
          onSaid={setSaid}
        />
      )}
      {ownRooms.matching > 0 && (
        <>
          <ScheduleTable scope={scope}>
            {ownRooms.duties.map((duty) => (
              <DutyRow
                key={duty.id}
                label={ownRoomWords(duty.roomNumber)}
                duty={duty}
                scope={scope}
                onSaid={setSaid}
              />
            ))}
          </ScheduleTable>
          <ListPager
            page={ownRooms.page}
            matching={ownRooms.matching}
            pageSize={OWN_ROOM_PAGE_SIZE}
            noun="kamar"
            keepsPlace
            stepsOnOnePage={false}
            addressOf={(page) =>
              cleaningAddress({ dorm, day: params.day, page }, today)
            }
          />
        </>
      )}
    </section>
  );
}
