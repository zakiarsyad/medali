"use client";

import { type KeyboardEvent, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { ModeSwitch } from "@/ui/mode-switch";
import { SEARCH_TEXT_MAX } from "@/ui/search-text";
import { sendForm } from "@/ui/send-form";
import { useFound } from "@/ui/use-found";
import { useSaveState } from "@/ui/use-save-state";
import {
  type DraftPick,
  FIRST_REASON,
  previewOf,
  START_POINTS,
  withoutPick,
  withPicks,
} from "./entry-draft";
import styles from "./siku.module.css";
import {
  groupPicksAction,
  saveSikuEntryAction,
  searchSikuStudentsAction,
} from "./siku-actions";
import {
  BASIS_MAX_LENGTH,
  ENTRY_NOTE_MAX_LENGTH,
  POINTS_MAX,
  POINTS_MIN,
  REASON_WITH_BASIS,
  reasonsOf,
  SIKU_KINDS,
  type SikuKind,
  type SikuReason,
} from "./siku-ids";
import type { GroupChoice, SikuPick } from "./siku-picks";
import { KIND_WORDS, REASON_WORDS } from "./siku-words";

const START: FormState = { error: null, done: null };

const KIND_MODES = SIKU_KINDS.map((each) => [each, KIND_WORDS[each]] as const);

export const NOBODY_FOUND = "Tidak ada mahasiswa aktif yang cocok.";

/**
 * The search box sits inside the form, where Enter would send the whole
 * entry while the person only means to search.
 */
function keepFormOnEnter(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") event.preventDefault();
}

function Found({
  query,
  found,
  onPick,
}: {
  query: string;
  found: SikuPick[];
  onPick: (pick: SikuPick) => void;
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
          {pick.name} · NIM {pick.nim} · {pick.program}
        </button>
      ))}
    </div>
  );
}

function Chosen({
  chosen,
  onRemove,
  onClear,
}: {
  chosen: DraftPick[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  if (chosen.length === 0) return null;
  return (
    <ul className={styles.chips}>
      {chosen.map((pick) => (
        <li key={pick.id} className={styles.chip}>
          {pick.name}
          <button
            type="button"
            className={shared.link}
            aria-label={`Hapus ${pick.name}`}
            onClick={() => onRemove(pick.id)}
          >
            ×
          </button>
        </li>
      ))}
      <li>
        <button type="button" className={shared.link} onClick={onClear}>
          Kosongkan
        </button>
      </li>
    </ul>
  );
}

function Preview({
  base,
  chosen,
  kind,
  points,
}: {
  base: number;
  chosen: DraftPick[];
  kind: SikuKind;
  points: string;
}) {
  if (chosen.length === 0) {
    return (
      <p className={shared.detail}>
        Pilih mahasiswa satu per satu, atau tambahkan satu kelompok pengasuhan
        sekaligus. SIKU setiap mahasiswa dimulai dari {base}.
      </p>
    );
  }
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>SIKU sekarang</th>
            <th>Setelah disimpan</th>
          </tr>
        </thead>
        <tbody>
          {previewOf(base, chosen, kind, points).map((row) => (
            <tr key={row.id}>
              <td data-title="Mahasiswa">
                <b className={shared.typed}>{row.name}</b>
                <small className={shared.detail}>{row.nim}</small>
              </td>
              <td data-title="SIKU sekarang">{row.now}</td>
              <td className={styles.strong} data-title="Setelah disimpan">
                {row.after}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * "Input nilai SIKU": Penambahan or Pengurangan, its reason, the points,
 * the day and a note, and the students it is for, picked by search or a
 * whole kelompok pengasuhan at once. A table shows each student's SIKU
 * now and after the save. After an entry is kept the form starts over,
 * with a new key for the next one.
 */
export function SikuForm({
  newEntryId,
  base,
  today,
  groups,
}: {
  newEntryId: string;
  base: number;
  today: string;
  groups: GroupChoice[];
}) {
  // Kept as it was when the form opened: two presses of "Simpan" must
  // send the same key.
  const [id, setId] = useState(newEntryId);
  const [kind, setKind] = useState<SikuKind>("gain");
  const [reason, setReason] = useState<SikuReason>(FIRST_REASON.gain);
  const [points, setPoints] = useState(START_POINTS.gain);
  const [day, setDay] = useState(today);
  const [basis, setBasis] = useState("");
  const [note, setNote] = useState("");
  const [chosen, setChosen] = useState<DraftPick[]>([]);
  const [query, setQuery] = useState("");
  const found = useFound(query, searchSikuStudentsAction);
  const needsBasis = reason === REASON_WITH_BASIS;

  function chooseKind(next: SikuKind) {
    setKind(next);
    setReason(FIRST_REASON[next]);
    setPoints(START_POINTS[next]);
  }

  function chooseReason(sent: string) {
    const named = reasonsOf(kind).find((each) => each === sent);
    if (named) setReason(named);
  }

  function pick(student: SikuPick) {
    setQuery("");
    setChosen((before) => withPicks(before, [student]));
  }

  async function addGroup(groupId: string) {
    if (groupId === "") return;
    const members = await groupPicksAction(groupId);
    setChosen((before) => withPicks(before, members));
  }

  async function save(before: FormState, sent: FormData): Promise<FormState> {
    const after = await saveSikuEntryAction(before, sent);
    if (after.done) {
      setChosen([]);
      setNote("");
      setBasis("");
      setId(crypto.randomUUID());
    }
    return after;
  }

  const [state, action, pending] = useSaveState(save, START);

  return (
    // noValidate: the server says what is wrong, in the app's own words.
    <form onSubmit={(event) => sendForm(event, action)} noValidate>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      {chosen.map((each) => (
        <input key={each.id} type="hidden" name="student" value={each.id} />
      ))}
      <ModeSwitch
        legend="Jenis"
        modes={KIND_MODES}
        mode={kind}
        onChoose={chooseKind}
      />
      <div className={shared.form}>
        <label className={`${shared.field} ${styles.full}`}>
          Alasan {KIND_WORDS[kind].toLowerCase()}
          <select
            name="reason"
            className={shared.input}
            value={reason}
            onChange={(event) => chooseReason(event.target.value)}
          >
            {reasonsOf(kind).map((each) => (
              <option key={each} value={each}>
                {REASON_WORDS[each]}
              </option>
            ))}
          </select>
        </label>
        <label className={shared.field}>
          Poin
          <input
            name="points"
            type="number"
            inputMode="numeric"
            min={POINTS_MIN}
            max={POINTS_MAX}
            step={1}
            className={shared.input}
            value={points}
            onChange={(event) => setPoints(event.target.value)}
          />
        </label>
        <label className={shared.field}>
          Tanggal
          <input
            name="day"
            type="date"
            max={today}
            className={shared.input}
            value={day}
            onChange={(event) => setDay(event.target.value)}
          />
        </label>
        {needsBasis && (
          <label className={`${shared.field} ${styles.full}`}>
            Dasar atau nomor surat
            <input
              name="basis"
              className={shared.input}
              maxLength={BASIS_MAX_LENGTH}
              placeholder="Wajib untuk ketentuan sesuai keputusan Direktur/Wakil Direktur"
              value={basis}
              onChange={(event) => setBasis(event.target.value)}
            />
          </label>
        )}
        <label className={`${shared.field} ${styles.full}`}>
          Keterangan
          <textarea
            name="note"
            className={shared.input}
            maxLength={ENTRY_NOTE_MAX_LENGTH}
            placeholder="Rincian kegiatan atau pelanggaran"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <div className={styles.full}>
          <span className={shared.label}>Mahasiswa ({chosen.length})</span>
          <div className={styles.pickRow}>
            <div>
              <input
                type="search"
                className={shared.input}
                aria-label="Cari mahasiswa"
                placeholder="Ketik nama atau NIM mahasiswa aktif"
                value={query}
                maxLength={SEARCH_TEXT_MAX}
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={keepFormOnEnter}
              />
              <Found query={query} found={found} onPick={pick} />
            </div>
            <select
              className={shared.input}
              aria-label="Tambah satu kelompok pengasuhan"
              value=""
              onChange={(event) => addGroup(event.target.value)}
            >
              <option value="">Tambah satu kelompok pengasuhan…</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.code} ({group.members})
                </option>
              ))}
            </select>
          </div>
          <Chosen
            chosen={chosen}
            onRemove={(removed) =>
              setChosen((before) => withoutPick(before, removed))
            }
            onClear={() => setChosen([])}
          />
        </div>
        <div className={styles.full}>
          <Preview base={base} chosen={chosen} kind={kind} points={points} />
        </div>
        <div className={`${shared.actions} ${styles.full}`}>
          <button type="submit" className={shared.button} disabled={pending}>
            Simpan {KIND_WORDS[kind].toLowerCase()}
          </button>
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}
