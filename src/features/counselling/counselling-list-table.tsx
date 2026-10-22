"use client";

import { useState, useTransition } from "react";
import type { SessionHistory } from "@/mental-health/session-view";
import type { Parsed } from "@/parsed";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { ConsentBadge } from "./consent-badge";
import { openStudentSessionsAction } from "./counselling-list-actions";
import type { CounsellingStudentRow } from "./counselling-list-view";
import {
  NOTHING,
  scheduleWords,
  sessionsWords,
} from "./counselling-list-words";
import { SessionHistoryList } from "./session-history-list";
import { SharingBadge } from "./sharing-badge";

/** How many columns "Daftar mahasiswa" has, for the row of "Rincian". */
const LIST_COLUMNS = 6;

/** What "Buka" does, or null for an account without the panels. */
export type OpenStudent = ((row: CounsellingStudentRow) => void) | null;

/**
 * "Rincian" of a row: the student's sessions are asked of the server
 * only once it is opened, and again at each opening, so each one is
 * logged. "Tampilkan lebih banyak" asks for 10 more.
 */
function useRincian(studentId: string) {
  const [opened, setOpened] = useState<Parsed<SessionHistory> | null>(null);
  const [steps, setSteps] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startOpening] = useTransition();

  function load(asked: number) {
    setSteps(asked);
    startOpening(async () => {
      setOpened(await openStudentSessionsAction(studentId, asked));
    });
  }

  function toggle() {
    if (isOpen) {
      setIsOpen(false);
      setOpened(null);
      return;
    }
    setIsOpen(true);
    load(1);
  }

  return { opened, isOpen, pending, toggle, more: () => load(steps + 1) };
}

/**
 * What "Rincian" shows as the server sent it: the sessions, read only,
 * or why it was refused.
 */
export function StudentSessions({
  opened,
  pending,
  onMore,
}: {
  opened: Parsed<SessionHistory>;
  pending: boolean;
  onMore: () => void;
}) {
  if (!opened.ok) {
    return <FormMessage state={{ error: opened.error, done: null }} />;
  }
  return (
    <SessionHistoryList
      history={opened.value}
      mayChange={false}
      pending={pending}
      onMore={onMore}
      onChanged={() => undefined}
    />
  );
}

function RincianRow({ rincian }: { rincian: ReturnType<typeof useRincian> }) {
  const { opened, pending, more } = rincian;
  if (opened === null) return null;
  return (
    <tr>
      <td colSpan={LIST_COLUMNS}>
        <StudentSessions opened={opened} pending={pending} onMore={more} />
      </td>
    </tr>
  );
}

function CounsellingListRow({
  row,
  onOpen,
}: {
  row: CounsellingStudentRow;
  onOpen: OpenStudent;
}) {
  const rincian = useRincian(row.studentId);
  return (
    <>
      <tr>
        <td className={shared.rowHeading} data-title="Mahasiswa">
          <b className={shared.typed}>{row.name}</b>
          <small className={shared.detail}>
            {row.nim} · {row.program}
          </small>
        </td>
        <td data-title="Persetujuan">
          <ConsentBadge status={row.consent} />
        </td>
        <td data-title="Konseling">
          {sessionsWords(row.sessions, row.nextDay)}
        </td>
        <td data-title="Jadwal">{scheduleWords(row.schedule)}</td>
        <td data-title="Publikasi">
          {row.sharing === null ? (
            NOTHING
          ) : (
            <SharingBadge status={row.sharing} />
          )}
        </td>
        <td className={shared.rowActions}>
          <button
            type="button"
            className={shared.link}
            aria-expanded={rincian.isOpen}
            disabled={rincian.pending}
            onClick={rincian.toggle}
          >
            {rincian.isOpen ? "Tutup" : "Rincian"}
          </button>
          {onOpen && (
            <button
              type="button"
              className={shared.quiet}
              onClick={() => onOpen(row)}
            >
              Buka
            </button>
          )}
        </td>
      </tr>
      {rincian.isOpen && <RincianRow rincian={rincian} />}
    </>
  );
}

/** The rows of "Daftar mahasiswa" on Konseling; on a phone each student is a card. */
export function CounsellingListTable({
  rows,
  onOpen = null,
}: {
  rows: CounsellingStudentRow[];
  onOpen?: OpenStudent;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Persetujuan</th>
            <th>Konseling</th>
            <th>Jadwal</th>
            <th>Publikasi</th>
            <th>
              <span className={shared.hidden}>Rincian</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <CounsellingListRow key={row.studentId} row={row} onOpen={onOpen} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
