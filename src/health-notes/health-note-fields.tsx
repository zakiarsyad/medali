import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { FinalCategoryBadge } from "./category-badge";
import type { FitnessCategory } from "./fitness-ids";
import { finalCategory } from "./health-category";
import {
  type NoteDraft,
  withCategory,
  withIllness,
  withIllnessNote,
} from "./health-draft";
import {
  ADVICE_MAX,
  type HealthNote,
  ILLNESSES,
  type Illness,
  NOTE_CATEGORIES,
  type NoteCategory,
  SHORT_TEXT_MAX,
} from "./health-ids";
import { NOTE_DAY_IN_FUTURE } from "./health-input";
import styles from "./health-notes.module.css";
import {
  categoryHint,
  examinerOf,
  FOLLOW_TEST_WORDS,
  ILLNESS_WORDS,
  NO_NOTE_YET,
  NOTE_CATEGORY_WORDS,
  noteText,
} from "./health-words";
import type { HealthSubject } from "./note-subject";

/** "Catatan terakhir", or that there is none, and "Kategori sekarang". */
export function SubjectSummary({ subject }: { subject: HealthSubject }) {
  const [latest] = subject.notes;
  const final = finalCategory(subject.test, latest?.category ?? null);
  return (
    <p className={styles.note}>
      {latest ? `Catatan terakhir: ${noteText(latest)}` : NO_NOTE_YET} Kategori
      sekarang: <FinalCategoryBadge final={final} showsMark />
    </p>
  );
}

/** "Catatan sebelumnya": the notes before the latest, newest first. */
export function EarlierNotes({ notes }: { notes: readonly HealthNote[] }) {
  const earlier = notes.slice(1);
  if (earlier.length === 0) return null;
  return (
    <details className={styles.earlier}>
      <summary>Catatan sebelumnya ({earlier.length})</summary>
      <ul className={styles.earlierList}>
        {earlier.map((note) => (
          <li key={note.id}>
            <b>{shownDay(note.examinedOn)}</b> · {examinerOf(note)}
            <small className={shared.detail}>{noteText(note)}</small>
          </li>
        ))}
      </ul>
    </details>
  );
}

function categoryNamed(sent: string): NoteCategory | null {
  return NOTE_CATEGORIES.find((category) => category === sent) ?? null;
}

function IllnessNotes({
  draft,
  onDraft,
}: {
  draft: NoteDraft;
  onDraft: (draft: NoteDraft) => void;
}) {
  return draft.illnesses.map((illness: Illness) => (
    <label key={illness} className={`${shared.field} ${styles.full}`}>
      Catatan {ILLNESS_WORDS[illness].toLowerCase()}
      <input type="hidden" name="illness" value={illness} />
      <input
        name="illnessNote"
        className={shared.input}
        maxLength={SHORT_TEXT_MAX}
        placeholder="Misalnya sejak kapan, kontrol rutin, batasan kegiatan"
        value={draft.illnessNotes[illness] ?? ""}
        onChange={(event) =>
          onDraft(withIllnessNote(draft, illness, event.target.value))
        }
      />
    </label>
  ));
}

/**
 * The fields of a note: Tanggal, Pemeriksa, "Riwayat penyakit" with a
 * short note for each illness picked, "Riwayat lain", "Obat yang rutin
 * diminum", "Catatan dan rekomendasi" and "Pertimbangan kategori", with
 * the test's category and the final one beside it.
 */
export function NoteFields({
  draft,
  test,
  today,
  examinedOn,
  onDraft,
  onExaminedOn,
}: {
  draft: NoteDraft;
  test: FitnessCategory | null;
  today: string;
  examinedOn: string;
  onDraft: (draft: NoteDraft) => void;
  onExaminedOn: (day: string) => void;
}) {
  const final = finalCategory(test, draft.category);
  return (
    <div className={shared.form}>
      <label className={shared.field}>
        Tanggal
        <input
          type="date"
          name="examinedOn"
          className={shared.input}
          value={examinedOn}
          max={today}
          onChange={(event) => onExaminedOn(event.target.value)}
        />
        {examinedOn > today && (
          <span className={styles.fault}>{NOTE_DAY_IN_FUTURE}</span>
        )}
      </label>
      <label className={shared.field}>
        Pemeriksa
        <input
          name="examiner"
          className={shared.input}
          maxLength={SHORT_TEXT_MAX}
          placeholder="Dokter atau tim kesehatan"
          value={draft.examiner}
          onChange={(event) =>
            onDraft({ ...draft, examiner: event.target.value })
          }
        />
      </label>
      <fieldset className={`${shared.roles} ${styles.full}`}>
        <legend className={shared.label}>Riwayat penyakit</legend>
        {ILLNESSES.map((illness) => (
          <label key={illness} className={shared.role}>
            <input
              type="checkbox"
              checked={draft.illnesses.includes(illness)}
              onChange={(event) =>
                onDraft(withIllness(draft, illness, event.target.checked))
              }
            />
            {ILLNESS_WORDS[illness]}
          </label>
        ))}
      </fieldset>
      <IllnessNotes draft={draft} onDraft={onDraft} />
      <label className={shared.field}>
        Riwayat lain
        <input
          name="otherHistory"
          className={shared.input}
          maxLength={SHORT_TEXT_MAX}
          placeholder="Penyakit lain yang tidak ada di daftar"
          value={draft.otherHistory}
          onChange={(event) =>
            onDraft({ ...draft, otherHistory: event.target.value })
          }
        />
      </label>
      <label className={shared.field}>
        Obat yang rutin diminum
        <input
          name="medicine"
          className={shared.input}
          maxLength={SHORT_TEXT_MAX}
          placeholder="Kosongkan bila tidak ada"
          value={draft.medicine}
          onChange={(event) =>
            onDraft({ ...draft, medicine: event.target.value })
          }
        />
      </label>
      <label className={`${shared.field} ${styles.full}`}>
        Catatan dan rekomendasi
        <textarea
          name="advice"
          className={shared.input}
          maxLength={ADVICE_MAX}
          placeholder="Anjuran, batasan kegiatan, atau rujukan"
          value={draft.advice}
          onChange={(event) =>
            onDraft({ ...draft, advice: event.target.value })
          }
        />
      </label>
      <label className={shared.field}>
        Pertimbangan kategori
        <select
          name="category"
          className={shared.input}
          value={draft.category ?? ""}
          onChange={(event) =>
            onDraft(withCategory(draft, categoryNamed(event.target.value)))
          }
        >
          <option value="">{FOLLOW_TEST_WORDS}</option>
          {NOTE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {NOTE_CATEGORY_WORDS[category]}
            </option>
          ))}
        </select>
      </label>
      <p className={styles.hint}>
        {categoryHint(test ?? "untested", final.category)}
      </p>
    </div>
  );
}
