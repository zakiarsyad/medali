import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { SEARCH_TEXT_MAX } from "@/ui/search-text";
import { useFound } from "@/ui/use-found";
import { searchParticipantStudentsAction } from "./actions";
import styles from "./activities.module.css";
import { chosenCountWords } from "./form-words";
import type { RecordStudent } from "./manual-record";
import {
  chosenCount,
  classesOffered,
  cohortsOffered,
  matchingClasses,
  type ParticipantDraft,
  type ParticipantPool,
  sentValues,
  withClassToggled,
  withCohortToggled,
  withMode,
  withoutStudent,
  withStudent,
} from "./participant-draft";
import {
  PARTICIPANT_MODE_WORDS,
  PARTICIPANT_MODES,
  TOO_FEW_COHORTS,
} from "./participant-input";
import { Offered } from "./record-student-field";
import { shownCount } from "./schedule-words";

type Change = (change: (draft: ParticipantDraft) => ParticipantDraft) => void;

/** Per mahasiswa: a search of Aktif students, and those picked with ×. */
function StudentsPart({
  draft,
  change,
}: {
  draft: ParticipantDraft;
  change: Change;
}) {
  const [query, setQuery] = useState("");
  const found = useFound(query, searchParticipantStudentsAction);

  function pick(student: RecordStudent) {
    setQuery("");
    const { id, name, nim } = student;
    change((before) => withStudent(before, { id, name, nim, isActive: true }));
  }

  return (
    <>
      <input
        type="search"
        className={shared.input}
        aria-label="Cari mahasiswa"
        placeholder="Ketik nama atau NIM mahasiswa aktif"
        value={query}
        maxLength={SEARCH_TEXT_MAX}
        autoComplete="off"
        onChange={(event) => setQuery(event.target.value)}
      />
      <Offered query={query} found={found} onPick={pick} />
      {draft.students.length > 0 && (
        <ul className={styles.chips}>
          {draft.students.map((student) => (
            <li key={student.id} className={styles.chip}>
              {student.name} · NIM {student.nim}
              {!student.isActive && " · tidak dihitung"}
              <button
                type="button"
                className={shared.link}
                aria-label={`Hapus ${student.name}`}
                onClick={() =>
                  change((before) => withoutStudent(before, student.id))
                }
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Per kelas: "Cari kelas", and the first matches each with a tick. */
function ClassesPart({
  draft,
  pool,
  change,
}: {
  draft: ParticipantDraft;
  pool: ParticipantPool;
  change: Change;
}) {
  const [query, setQuery] = useState("");
  const offered = classesOffered(pool.classes, draft.classNames);
  const shown = matchingClasses(offered, query);
  return (
    <>
      <input
        type="search"
        className={shared.input}
        aria-label="Cari kelas"
        placeholder="Cari kelas"
        value={query}
        maxLength={SEARCH_TEXT_MAX}
        autoComplete="off"
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className={styles.classList}>
        {shown.length === 0 && (
          <p className={shared.detail}>Tidak ada kelas yang cocok.</p>
        )}
        {shown.map((row) => (
          <label key={row.className} className={shared.role}>
            <input
              type="checkbox"
              checked={draft.classNames.includes(row.className)}
              onChange={() =>
                change((before) => withClassToggled(before, row.className))
              }
            />
            {row.className}
            <span className={shared.detail}>({shownCount(row.students)})</span>
          </label>
        ))}
      </div>
    </>
  );
}

/** Per angkatan and Lintas angkatan: each angkatan a press, with its count. */
function CohortsPart({
  draft,
  pool,
  change,
}: {
  draft: ParticipantDraft;
  pool: ParticipantPool;
  change: Change;
}) {
  const offered = cohortsOffered(pool.cohorts, draft.cohortYears);
  return (
    <>
      <div className={styles.choices}>
        {offered.map((row) => (
          <button
            key={row.cohortYear}
            type="button"
            className={styles.choice}
            aria-pressed={draft.cohortYears.includes(row.cohortYear)}
            onClick={() =>
              change((before) => withCohortToggled(before, row.cohortYear))
            }
          >
            Angkatan {row.cohortYear}{" "}
            <span className={shared.detail}>({shownCount(row.students)})</span>
          </button>
        ))}
      </div>
      {draft.mode === "cohorts" && (
        <p className={shared.detail}>{TOO_FEW_COHORTS.error}</p>
      )}
    </>
  );
}

function ModePart({
  draft,
  pool,
  change,
}: {
  draft: ParticipantDraft;
  pool: ParticipantPool;
  change: Change;
}) {
  switch (draft.mode) {
    case "students":
      return <StudentsPart draft={draft} change={change} />;
    case "classes":
      return <ClassesPart draft={draft} pool={pool} change={change} />;
    case "cohort":
    case "cohorts":
      return <CohortsPart draft={draft} pool={pool} change={change} />;
  }
}

/**
 * "Peserta" on the form of an extra activity: the four kinds of choice,
 * the picks of the one shown, and "Sasaran" with how many Aktif students
 * they hold, counted again at each pick. Only the picks of the kind shown
 * are sent.
 */
export function ParticipantField({
  start,
  pool,
}: {
  start: ParticipantDraft;
  pool: ParticipantPool;
}) {
  const [draft, setDraft] = useState(start);
  return (
    <div className={`${styles.full} ${styles.participants}`}>
      <fieldset className={styles.modes}>
        <legend className={shared.label}>Peserta</legend>
        {PARTICIPANT_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            className={styles.choice}
            aria-pressed={draft.mode === mode}
            onClick={() => setDraft((before) => withMode(before, mode))}
          >
            {PARTICIPANT_MODE_WORDS[mode]}
          </button>
        ))}
      </fieldset>
      <input type="hidden" name="participantMode" value={draft.mode} />
      {sentValues(draft).map((value) => (
        <input key={value} type="hidden" name="participant" value={value} />
      ))}
      <ModePart draft={draft} pool={pool} change={setDraft} />
      <p className={shared.detail}>
        {chosenCountWords(chosenCount(draft, pool))}
      </p>
    </div>
  );
}
