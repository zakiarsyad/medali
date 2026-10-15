"use client";

import { type KeyboardEvent, useActionState, useState } from "react";
import { DORM_SHORT_NAMES } from "@/dorms/dorms";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { SEARCH_TEXT_MAX } from "@/ui/search-text";
import { sendForm } from "@/ui/send-form";
import { useFound } from "@/ui/use-found";
import {
  saveViolationsAction,
  searchViolationStudentsAction,
} from "./violation-actions";
import {
  announcementNote,
  type DraftRow,
  withDraftRow,
  withoutDraftRow,
} from "./violation-draft";
import {
  ANNOUNCEMENT_TIME,
  APPEAL_HOURS,
  OTHER_PUNISHMENT_MAX_LENGTH,
  PUNISHMENTS,
  REASON_MAX_LENGTH,
  VIOLATION_REASONS,
} from "./violation-ids";
import type { ViolationPick } from "./violation-residents";
import { PUNISHMENT_WORDS, punishmentText } from "./violation-words";
import styles from "./violations.module.css";

const START: FormState = { error: null, done: null };

export const NOBODY_FOUND = "Tidak ada penghuni asrama yang cocok.";
export const EMPTY_LIST = "Belum ada pelanggaran di daftar.";

/**
 * The search box sits inside the form, where Enter would send the whole
 * list while the person only means to search.
 */
function keepFormOnEnter(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") event.preventDefault();
}

function pickWords(pick: ViolationPick): string {
  return `${pick.name} · NIM ${pick.nim} · ${DORM_SHORT_NAMES[pick.dorm]}`;
}

function Found({
  query,
  found,
  onPick,
}: {
  query: string;
  found: ViolationPick[];
  onPick: (pick: ViolationPick) => void;
}) {
  if (query.trim() === "") return null;
  if (found.length === 0) {
    return <p className={shared.detail}>{NOBODY_FOUND}</p>;
  }
  return (
    <div className={styles.found}>
      {found.map((pick) => (
        <button
          key={pick.id}
          type="button"
          className={shared.quiet}
          onClick={() => onPick(pick)}
        >
          {pickWords(pick)}
        </button>
      ))}
    </div>
  );
}

function StudentPicker({
  picked,
  onPick,
}: {
  picked: ViolationPick | null;
  onPick: (pick: ViolationPick | null) => void;
}) {
  const [query, setQuery] = useState("");
  const found = useFound(query, searchViolationStudentsAction);
  if (picked !== null) {
    return (
      <div className={shared.actions}>
        <b className={styles.picked}>{pickWords(picked)}</b>
        <button
          type="button"
          className={shared.link}
          onClick={() => onPick(null)}
        >
          Ganti
        </button>
      </div>
    );
  }
  return (
    <div>
      <input
        type="search"
        className={shared.input}
        aria-label="Cari mahasiswa"
        placeholder="Ketik nama atau NIM penghuni asrama"
        value={query}
        maxLength={SEARCH_TEXT_MAX}
        autoComplete="off"
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={keepFormOnEnter}
      />
      <Found
        query={query}
        found={found}
        onPick={(pick) => {
          setQuery("");
          onPick(pick);
        }}
      />
    </div>
  );
}

function DraftTable({
  rows,
  onRemove,
}: {
  rows: DraftRow[];
  onRemove: (key: string) => void;
}) {
  if (rows.length === 0) return <p className={styles.note}>{EMPTY_LIST}</p>;
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Alasan</th>
            <th>Hukuman</th>
            <th>
              <span className={shared.hidden}>Tindakan</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td className={shared.rowHeading} data-title="Mahasiswa">
                <b className={shared.typed}>{row.name}</b>
                <small className={shared.detail}>
                  {row.nim} · {DORM_SHORT_NAMES[row.dorm]}
                </small>
              </td>
              <td data-title="Alasan">
                <span className={shared.typed}>{row.reason}</span>
              </td>
              <td data-title="Hukuman">
                <span className={shared.typed}>
                  {punishmentText(row.punishment, row.otherPunishment)}
                </span>
              </td>
              <td className={shared.rowActions}>
                <button
                  type="button"
                  className={shared.danger}
                  onClick={() => onRemove(row.key)}
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One field of each kind per row, read by the server in the same order. */
function RowFields({ rows }: { rows: DraftRow[] }) {
  return rows.map((row) => (
    <span key={row.key} hidden>
      <input type="hidden" name="student" value={row.studentId} />
      <input type="hidden" name="reason" value={row.reason} />
      <input type="hidden" name="punishment" value={row.punishment} />
      <input type="hidden" name="otherPunishment" value={row.otherPunishment} />
    </span>
  ));
}

/**
 * "Input dan publikasi pelanggaran": the violation day, the day and hour
 * of the announcement, and a list of rows, each a resident with a reason
 * and a punishment, added with "Tambahkan ke daftar". "Simpan dan
 * jadwalkan publikasi" keeps the whole list; the form then starts a new
 * list with a new key and keeps the days.
 */
export function ViolationForm({
  newListId,
  today,
  ownStudentId,
}: {
  newListId: string;
  today: string;
  /** The student of the account, who may not be picked. */
  ownStudentId: string | null;
}) {
  // Kept as it was when the form opened: two presses of the save button
  // must send the same key.
  const [id, setId] = useState(newListId);
  const [day, setDay] = useState(today);
  const [announceDay, setAnnounceDay] = useState(today);
  const [announceTime, setAnnounceTime] = useState(ANNOUNCEMENT_TIME);
  const [picked, setPicked] = useState<ViolationPick | null>(null);
  const [reason, setReason] = useState("");
  const [punishment, setPunishment] = useState<string>(PUNISHMENTS[0]);
  const [otherPunishment, setOtherPunishment] = useState("");
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [addError, setAddError] = useState<string | null>(null);

  function add() {
    const typed = { reason, punishment, otherPunishment };
    const added = withDraftRow(
      rows,
      picked,
      typed,
      ownStudentId,
      crypto.randomUUID(),
    );
    if (!added.ok) {
      setAddError(added.error);
      return;
    }
    setAddError(null);
    setRows(added.value);
    setPicked(null);
    setReason("");
    setOtherPunishment("");
  }

  async function save(before: FormState, sent: FormData): Promise<FormState> {
    const after = await saveViolationsAction(before, sent);
    if (after.done) {
      setRows([]);
      setId(crypto.randomUUID());
    }
    return after;
  }

  const [state, action, pending] = useActionState(save, START);

  return (
    // noValidate: the server says what is wrong, in the app's own words.
    <form onSubmit={(event) => sendForm(event, action)} noValidate>
      <h2 className={shared.heading}>Input dan publikasi pelanggaran</h2>
      <p className={styles.sub}>
        Catat pelanggaran hari ini, lalu tentukan jam pengumuman. Mahasiswa
        dapat mengajukan advokasi sampai {APPEAL_HOURS} jam setelah diumumkan.
      </p>
      <input type="hidden" name="id" value={id} />
      <RowFields rows={rows} />
      <div className={shared.form}>
        <label className={`${shared.field} ${styles.field}`}>
          Tanggal pelanggaran
          <input
            name="day"
            type="date"
            max={today}
            className={shared.input}
            value={day}
            onChange={(event) => setDay(event.target.value)}
          />
        </label>
        <fieldset className={`${shared.field} ${styles.field}`}>
          <legend className={shared.label}>Diumumkan pada</legend>
          <div className={styles.when}>
            <input
              name="announceDay"
              type="date"
              aria-label="Tanggal pengumuman"
              min={day}
              className={shared.input}
              value={announceDay}
              onChange={(event) => setAnnounceDay(event.target.value)}
            />
            <input
              name="announceTime"
              type="time"
              aria-label="Jam pengumuman"
              className={shared.input}
              value={announceTime}
              onChange={(event) => setAnnounceTime(event.target.value)}
            />
          </div>
        </fieldset>
        <div className={`${shared.form} ${styles.full} ${styles.next}`}>
          <div className={`${shared.field} ${styles.field} ${styles.full}`}>
            <span className={shared.label}>Mahasiswa</span>
            <StudentPicker picked={picked} onPick={setPicked} />
          </div>
          <label className={`${shared.field} ${styles.field} ${styles.full}`}>
            Alasan pelanggaran
            <input
              className={shared.input}
              list="violation-reasons"
              placeholder="Pilih atau tulis alasan"
              maxLength={REASON_MAX_LENGTH}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              onKeyDown={keepFormOnEnter}
            />
            <datalist id="violation-reasons">
              {VIOLATION_REASONS.map((each) => (
                <option key={each} value={each} />
              ))}
            </datalist>
          </label>
          <label className={`${shared.field} ${styles.field}`}>
            Jenis hukuman
            <select
              className={shared.input}
              value={punishment}
              onChange={(event) => setPunishment(event.target.value)}
            >
              {PUNISHMENTS.map((each) => (
                <option key={each} value={each}>
                  {PUNISHMENT_WORDS[each]}
                </option>
              ))}
            </select>
          </label>
          {punishment === "other" && (
            <label className={`${shared.field} ${styles.field}`}>
              Hukuman lainnya
              <input
                className={shared.input}
                placeholder="Sebutkan hukumannya"
                maxLength={OTHER_PUNISHMENT_MAX_LENGTH}
                value={otherPunishment}
                onChange={(event) => setOtherPunishment(event.target.value)}
                onKeyDown={keepFormOnEnter}
              />
            </label>
          )}
          <div className={`${shared.actions} ${styles.full}`}>
            <button type="button" className={shared.quiet} onClick={add}>
              Tambahkan ke daftar
            </button>
            <FormMessage state={{ error: addError, done: null }} />
          </div>
        </div>
        <div className={styles.full}>
          <DraftTable
            rows={rows}
            onRemove={(key) => setRows(withoutDraftRow(rows, key))}
          />
        </div>
        <div className={`${shared.actions} ${styles.full}`}>
          <button
            type="submit"
            className={shared.button}
            disabled={pending || rows.length === 0}
          >
            Simpan dan jadwalkan publikasi ({rows.length})
          </button>
          <span className={styles.note}>
            {announcementNote(announceDay, announceTime, new Date())}
          </span>
        </div>
        <div className={styles.full}>
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}
