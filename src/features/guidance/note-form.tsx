"use client";

import {
  type KeyboardEvent,
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { FormMessage, type FormState } from "@/ui/form-message";
import { SEARCH_TEXT_MAX } from "@/ui/search-text";
import { sendForm } from "@/ui/send-form";
import { useFound } from "@/ui/use-found";
import {
  noteStudentBoxAction,
  saveViolationNoteAction,
  searchNoteStudentsAction,
} from "./note-actions";
import type { StudentBox as Box, NotePick } from "./note-student";
import { PUNISHMENT_WORDS } from "./note-words";
import {
  DESCRIPTION_EXAMPLES,
  DESCRIPTION_MAX_LENGTH,
  NOTE_PUNISHMENTS,
  OTHER_PUNISHMENT_MAX_LENGTH,
  REMARK_MAX_LENGTH,
} from "./violation-note-ids";
import styles from "./violation-notes.module.css";

const START: FormState = { error: null, done: null };

export const NOBODY_FOUND = "Tidak ada mahasiswa aktif yang cocok.";
export const NO_ACTIVE_NOTE =
  "Belum ada catatan pelanggaran aktif semester ini.";

/**
 * The search box sits inside the form, where Enter would send the whole
 * note while the person only means to search.
 */
function keepFormOnEnter(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") event.preventDefault();
}

function pickWords(pick: NotePick): string {
  return `${pick.name} · NIM ${pick.nim} · ${pick.program}`;
}

function Found({
  query,
  onPick,
}: {
  query: string;
  onPick: (pick: NotePick) => void;
}) {
  const found = useFound(query, searchNoteStudentsAction);
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

/**
 * "Mahasiswa": a name or a NIM is typed, the server offers the Aktif
 * students, and one is picked. The one picked stays until "Ganti".
 */
function StudentPicker({
  picked,
  onPick,
}: {
  picked: NotePick | null;
  onPick: (pick: NotePick | null) => void;
}) {
  const [query, setQuery] = useState("");
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
        placeholder="Ketik nama atau NIM mahasiswa"
        value={query}
        maxLength={SEARCH_TEXT_MAX}
        autoComplete="off"
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={keepFormOnEnter}
      />
      <Found
        query={query}
        onPick={(pick) => {
          setQuery("");
          onPick(pick);
        }}
      />
    </div>
  );
}

/** How many discipline penalties the student picked has, when any. */
export function penaltiesWords(penalties: number): string {
  if (penalties === 0) return "";
  return ` Mahasiswa ini juga punya ${penalties} hukuman disiplin tercatat.`;
}

/**
 * The active notes of the student picked this semester, or that there
 * are none, and how many discipline penalties they have.
 */
function StudentBox({ box }: { box: Box }) {
  const { notes, penalties } = box;
  if (notes.length === 0) {
    return (
      <p className={styles.box}>
        {NO_ACTIVE_NOTE}
        {penaltiesWords(penalties)}
      </p>
    );
  }
  const listed = notes
    .map((note) => `${shownDay(note.day)} ${note.description}`)
    .join("; ");
  return (
    <p className={styles.warnBox}>
      <b>{notes.length} catatan aktif semester ini</b>: {listed}. Catatan baru
      semester ini menjadi Pelanggaran lanjutan.{penaltiesWords(penalties)}
    </p>
  );
}

/**
 * "Catatan pelanggaran": Mahasiswa with the box of their active notes,
 * Tanggal, Uraian pelanggaran with ready examples, Jenis hukuman, what
 * Hukuman lainnya is, and Keterangan. After a save the student stays
 * picked and the form gets a new key for the next save; the Kategori is
 * worked out by the server. The box is read again whenever the notes in
 * force change, by a save here or by "Hapus" in the list.
 */
export function NoteForm({
  newKey,
  today,
  inForce,
}: {
  /** The key of the first save; two presses of "Simpan catatan" send the same one. */
  newKey: string;
  today: string;
  /** Changes whenever the numbers of the running semester change. */
  inForce: string;
}) {
  const [key, setKey] = useState(newKey);
  const [picked, setPicked] = useState<NotePick | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [day, setDay] = useState(today);
  const [description, setDescription] = useState("");
  const [punishment, setPunishment] = useState<string>(NOTE_PUNISHMENTS[0]);
  const [otherPunishment, setOtherPunishment] = useState("");
  const [remark, setRemark] = useState("");
  const [, startLoading] = useTransition();
  // The student asked for last: the box of one picked before must not
  // replace that of a later pick that answers sooner.
  const asked = useRef("");

  function load(studentId: string) {
    asked.current = studentId;
    startLoading(async () => {
      const found = await noteStudentBoxAction(studentId);
      if (asked.current === studentId) setBox(found);
    });
  }

  // The page is drawn again after a save or a removal; only then is the
  // box of the student still picked read again.
  const shownInForce = useRef(inForce);
  useEffect(() => {
    if (shownInForce.current === inForce) return;
    shownInForce.current = inForce;
    const studentId = asked.current;
    if (studentId === "") return;
    startLoading(async () => {
      const found = await noteStudentBoxAction(studentId);
      if (asked.current === studentId) setBox(found);
    });
  }, [inForce]);

  function pick(student: NotePick | null) {
    setPicked(student);
    setBox(null);
    if (student === null) {
      asked.current = "";
      return;
    }
    load(student.id);
  }

  async function save(before: FormState, sent: FormData): Promise<FormState> {
    const after = await saveViolationNoteAction(before, sent);
    if (after.done) {
      setKey(crypto.randomUUID());
      setDescription("");
      setOtherPunishment("");
      setRemark("");
    }
    return after;
  }

  const [state, action, pending] = useActionState(save, START);

  return (
    // noValidate: the server says what is wrong, in the app's own words.
    <form
      className={shared.panel}
      onSubmit={(event) => sendForm(event, action)}
      noValidate
    >
      <h2 className={shared.heading}>Catat pelanggaran</h2>
      <input type="hidden" name="id" value={key} />
      <input type="hidden" name="studentId" value={picked?.id ?? ""} />
      <div className={shared.form}>
        <div className={`${shared.field} ${styles.field} ${styles.full}`}>
          <span className={shared.label}>Mahasiswa</span>
          <StudentPicker picked={picked} onPick={pick} />
        </div>
        {box !== null && (
          <div className={styles.full}>
            <StudentBox box={box} />
          </div>
        )}
        <label className={`${shared.field} ${styles.field}`}>
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
        <label className={`${shared.field} ${styles.field}`}>
          Jenis hukuman
          <select
            name="punishment"
            className={shared.input}
            value={punishment}
            onChange={(event) => setPunishment(event.target.value)}
          >
            {NOTE_PUNISHMENTS.map((each) => (
              <option key={each} value={each}>
                {PUNISHMENT_WORDS[each]}
              </option>
            ))}
          </select>
        </label>
        <label className={`${shared.field} ${styles.field} ${styles.full}`}>
          Uraian pelanggaran
          <input
            name="description"
            className={shared.input}
            list="violation-note-examples"
            placeholder="Apa yang dilanggar"
            maxLength={DESCRIPTION_MAX_LENGTH}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onKeyDown={keepFormOnEnter}
          />
          <datalist id="violation-note-examples">
            {DESCRIPTION_EXAMPLES.map((each) => (
              <option key={each} value={each} />
            ))}
          </datalist>
        </label>
        {punishment === "other" && (
          <label className={`${shared.field} ${styles.field} ${styles.full}`}>
            Hukuman lainnya
            <input
              name="otherPunishment"
              className={shared.input}
              placeholder="Sebutkan"
              maxLength={OTHER_PUNISHMENT_MAX_LENGTH}
              value={otherPunishment}
              onChange={(event) => setOtherPunishment(event.target.value)}
              onKeyDown={keepFormOnEnter}
            />
          </label>
        )}
        <label className={`${shared.field} ${styles.field} ${styles.full}`}>
          Keterangan
          <textarea
            name="remark"
            rows={2}
            className={shared.input}
            placeholder="Opsional"
            maxLength={REMARK_MAX_LENGTH}
            value={remark}
            onChange={(event) => setRemark(event.target.value)}
          />
        </label>
        <div className={`${shared.actions} ${styles.full}`}>
          <button type="submit" className={shared.button} disabled={pending}>
            Simpan catatan
          </button>
        </div>
        <div className={styles.full}>
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}
