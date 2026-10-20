"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  useActionState,
  useRef,
  useState,
  useTransition,
} from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { SEARCH_TEXT_MAX } from "@/ui/search-text";
import { sendForm } from "@/ui/send-form";
import { useFound } from "@/ui/use-found";
import { draftFrom, EMPTY_DRAFT, type NoteDraft } from "./health-draft";
import { EarlierNotes, NoteFields, SubjectSummary } from "./health-note-fields";
import styles from "./health-notes.module.css";
import type { HealthPick, HealthSubject } from "./note-subject";

const START: FormState = { error: null, done: null };

/**
 * The actions of the server behind the form, each of the place it is
 * on: the students found for a text, the student picked, and the save.
 * Each checks again who asks and for whom.
 */
export interface NoteActions<Subject extends HealthSubject = HealthSubject> {
  search: (query: string) => Promise<HealthPick[]>;
  subject: (studentId: string) => Promise<Subject | null>;
  save: (before: FormState, form: FormData) => Promise<FormState>;
}

/** What "Mahasiswa" says of the students the place offers. */
export interface PickerWords {
  placeholder: string;
  nobodyFound: string;
}

/**
 * The search box sits inside the form, where Enter would send the whole
 * note while the person only means to search.
 */
function keepFormOnEnter(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") event.preventDefault();
}

function pickWords(pick: HealthPick): string {
  return `${pick.name} · NIM ${pick.nim} · ${pick.program}`;
}

function Found({
  query,
  search,
  nobodyFound,
  onPick,
}: {
  query: string;
  search: NoteActions["search"];
  nobodyFound: string;
  onPick: (pick: HealthPick) => void;
}) {
  const found = useFound(query, search);
  if (query.trim() === "") return null;
  if (found.length === 0) {
    return <p className={shared.detail}>{nobodyFound}</p>;
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
 * "Mahasiswa": a name or a NIM is typed, the server offers the students
 * the place lets the account write for, and one is picked. The one
 * picked stays until "Ganti mahasiswa".
 */
function HealthPicker({
  picked,
  search,
  words,
  onPick,
  onClear,
}: {
  picked: HealthPick | null;
  search: NoteActions["search"];
  words: PickerWords;
  onPick: (pick: HealthPick) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  if (picked) {
    return (
      <div className={styles.picked}>
        <b className={shared.typed}>{pickWords(picked)}</b>
        <button type="button" className={shared.link} onClick={onClear}>
          Ganti mahasiswa
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
        placeholder={words.placeholder}
        value={query}
        maxLength={SEARCH_TEXT_MAX}
        autoComplete="off"
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={keepFormOnEnter}
      />
      <Found
        query={query}
        search={search}
        nobodyFound={words.nobodyFound}
        onPick={(pick) => {
          setQuery("");
          onPick(pick);
        }}
      />
    </div>
  );
}

/**
 * The form of "Catatan kesehatan". Picking a student shows their latest
 * note and category, and fills the form with that note, so a new note
 * starts from the last one. After a save the student stays picked, their
 * notes are read again, and the form gets a new key for the next save.
 * A place may add fields of its own below the note, from what its
 * action read of the student.
 */
export function HealthNoteForm<Subject extends HealthSubject>({
  today,
  newKey,
  actions,
  words,
  more,
}: {
  /** Today on campus, where Tanggal starts. */
  today: string;
  /** The key of the first save; two presses of "Simpan catatan" send the same one. */
  newKey: string;
  actions: NoteActions<Subject>;
  words: PickerWords;
  /** The place's own fields for the student picked, sent with the note. */
  more?: (subject: Subject) => ReactNode;
}) {
  const [key, setKey] = useState(newKey);
  const [picked, setPicked] = useState<HealthPick | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [draft, setDraft] = useState<NoteDraft>(EMPTY_DRAFT);
  const [examinedOn, setExaminedOn] = useState(today);
  const [loading, startLoading] = useTransition();
  // The student asked for last: the notes of one picked before must not
  // replace those of a later pick that answers sooner.
  const asked = useRef("");

  function load(studentId: string) {
    asked.current = studentId;
    startLoading(async () => {
      const found = await actions.subject(studentId);
      if (asked.current !== studentId) return;
      setSubject(found);
      setDraft(draftFrom(found?.notes[0]));
    });
  }

  function pick(student: HealthPick) {
    setPicked(student);
    setSubject(null);
    setDraft(EMPTY_DRAFT);
    load(student.id);
  }

  function clear() {
    asked.current = "";
    setPicked(null);
    setSubject(null);
    setDraft(EMPTY_DRAFT);
  }

  async function save(before: FormState, sent: FormData): Promise<FormState> {
    const after = await actions.save(before, sent);
    if (after.done && picked) {
      setKey(crypto.randomUUID());
      load(picked.id);
    }
    return after;
  }

  const [state, action, pending] = useActionState(save, START);

  return (
    // noValidate: the server says what is wrong, in the app's own words.
    <form onSubmit={(event) => sendForm(event, action)} noValidate>
      <input type="hidden" name="id" value={key} />
      <input type="hidden" name="studentId" value={picked?.id ?? ""} />
      <span className={shared.label}>Mahasiswa</span>
      <HealthPicker
        picked={picked}
        search={actions.search}
        words={words}
        onPick={pick}
        onClear={clear}
      />
      {picked && loading && subject === null && (
        <p className={styles.note}>Memuat catatan kesehatan…</p>
      )}
      {subject && (
        <>
          <SubjectSummary subject={subject} />
          <EarlierNotes notes={subject.notes} />
          <NoteFields
            draft={draft}
            test={subject.test}
            today={today}
            examinedOn={examinedOn}
            onDraft={setDraft}
            onExaminedOn={setExaminedOn}
          />
          {more?.(subject)}
          <div className={styles.saveRow}>
            <button type="submit" className={shared.button} disabled={pending}>
              Simpan catatan
            </button>
          </div>
        </>
      )}
      <FormMessage state={state} />
    </form>
  );
}
