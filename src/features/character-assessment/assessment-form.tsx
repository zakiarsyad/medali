"use client";

import { type ReactNode, useActionState, useState } from "react";
import {
  levelOf,
  rerataOf,
  SCORE_MAX,
  SCORE_MIN,
  type Scores,
} from "@/character-scores/assessment-score";
import { Medal } from "@/character-scores/medal";
import { PredicateBadge } from "@/character-scores/predicate-badge";
import { shownRerata } from "@/character-scores/shown-rerata";
import {
  kindWords,
  type PenaltyKind,
} from "@/discipline-penalties/penalty-kinds";
import {
  CHARACTER_SCORE_CAP,
  limitedScore,
  limitedScores,
} from "@/discipline-penalties/score-limit";
import shared from "@/ui/data-screen.module.css";
import { text } from "@/ui/form-data";
import { FormMessage, type FormState } from "@/ui/form-message";
import { LimitNote } from "@/ui/limit-note";
import { MEDALI_VALUES, type ValueKey } from "@/ui/medali-values";
import { sendForm } from "@/ui/send-form";
import { ValueSwatch } from "@/ui/value-swatch";
import { saveAssessmentAction } from "./assessment-actions";
import {
  ASSESSMENT_SOURCES,
  NOTE_MAX_LENGTH,
  STARTING_SCORE,
} from "./assessment-ids";
import type { AssessmentPick } from "./assessment-picks";
import styles from "./character-assessment.module.css";
import { SourceOptions } from "./source-options";
import { StudentPicker } from "./student-picker";

const START: FormState = { error: null, done: null };

/** The text of each value's main indicator from Kurikulum, level 1 to 4. */
export type LevelTexts = Record<ValueKey, readonly string[]>;

const STARTING_SCORES: Scores = {
  M: STARTING_SCORE,
  E: STARTING_SCORE,
  D: STARTING_SCORE,
  A: STARTING_SCORE,
  L: STARTING_SCORE,
  I: STARTING_SCORE,
};

/**
 * The scores the sliders start at for a student: their latest, or 75
 * for one never assessed, held at 70 under a Ringan or Sedang penalty.
 */
function startingScoresOf(pick: AssessmentPick): Scores {
  return limitedScores(pick.latest ?? STARTING_SCORES, pick.limit !== null);
}

/** The scores a sent form held, which the server has just kept. */
function sentScores(form: FormData): Scores {
  return {
    M: Number(text(form, "score_M")),
    E: Number(text(form, "score_E")),
    D: Number(text(form, "score_D")),
    A: Number(text(form, "score_A")),
    L: Number(text(form, "score_L")),
    I: Number(text(form, "score_I")),
  };
}

/** Why the sliders of a student under a Ringan or Sedang penalty stop at 70. */
function limitNoteOf(limit: PenaltyKind): string {
  return `Mahasiswa ini menjalani hukuman disiplin ${kindWords(limit)}. Skor dibatasi paling tinggi ${CHARACTER_SCORE_CAP}.`;
}

export function ScoreSliders({
  scores,
  levelTexts,
  onChange,
  highest = SCORE_MAX,
}: {
  scores: Scores;
  levelTexts: LevelTexts;
  onChange: (key: ValueKey, score: number) => void;
  /** The highest score a slider offers: 70 for a limited student. */
  highest?: number;
}) {
  return (
    <div className={styles.sliders}>
      {MEDALI_VALUES.map(({ key, name }) => {
        const level = levelOf(scores[key]);
        return (
          <div key={key} className={styles.slider}>
            <span className={styles.sliderName}>
              <ValueSwatch value={key} />
              {name}
            </span>
            <input
              type="range"
              name={`score_${key}`}
              className={styles.range}
              min={SCORE_MIN}
              max={highest}
              step={1}
              value={scores[key]}
              aria-label={`Skor ${name}`}
              onChange={(event) => onChange(key, Number(event.target.value))}
            />
            <output className={styles.score}>{scores[key]}</output>
            <small className={styles.level}>
              Level {level} · {levelTexts[key][level - 1]}
            </small>
          </div>
        );
      })}
    </div>
  );
}

export function MedalPreview({
  picked,
  scores,
}: {
  picked: AssessmentPick | null;
  scores: Scores;
}) {
  if (!picked) {
    return (
      <p className={shared.empty}>
        Pilih mahasiswa untuk melihat pratinjau medali. Skor asesmen terakhir
        dimuat sebagai titik awal.
      </p>
    );
  }
  const rerata = rerataOf(scores);
  const { latest } = picked;
  const start = limitedScore(STARTING_SCORE, picked.limit !== null);
  return (
    <>
      <div className={styles.previewHead}>
        <h3 className={shared.heading}>Pratinjau medali</h3>
        <PredicateBadge rerata={rerata} />
      </div>
      <div className={styles.medalBox}>
        <Medal scores={scores} last={latest} />
      </div>
      <p className={styles.sub}>
        Rerata baru <b>{shownRerata(rerata)}</b>
        {latest
          ? `, asesmen sebelumnya ${shownRerata(rerataOf(latest))}. Garis putus-putus menunjukkan skor asesmen terakhir.`
          : `. Mahasiswa ini belum pernah diasesmen; slider dimulai dari ${start}.`}
      </p>
    </>
  );
}

/**
 * "Input capaian MEDALI" beside "Pratinjau medali". A student is picked,
 * and six sliders start at their latest scores, or at 75. The medal
 * shows the new shape over the last one. After an assessment is kept,
 * the student stays picked with it as their last one, and the form gets
 * a new key for the next. `head` is the title of the panel.
 */
export function AssessmentForm({
  newAssessmentId,
  levelTexts,
  head,
  startPick = null,
}: {
  newAssessmentId: string;
  levelTexts: LevelTexts;
  head: ReactNode;
  /** The student the form opens with, picked, as "Input asesmen" asks. */
  startPick?: AssessmentPick | null;
}) {
  // Kept as it was when the form opened: two presses of "Simpan asesmen"
  // must send the same key.
  const [id, setId] = useState(newAssessmentId);
  const [picked, setPicked] = useState<AssessmentPick | null>(startPick);
  const [scores, setScores] = useState<Scores>(
    startPick ? startingScoresOf(startPick) : STARTING_SCORES,
  );
  const [note, setNote] = useState("");

  function pick(student: AssessmentPick) {
    setPicked(student);
    setScores(startingScoresOf(student));
  }

  function change(key: ValueKey, score: number) {
    setScores((before) => ({ ...before, [key]: score }));
  }

  async function save(before: FormState, sent: FormData): Promise<FormState> {
    const after = await saveAssessmentAction(before, sent);
    if (after.done) {
      const saved = sentScores(sent);
      setPicked((was) => was && { ...was, latest: saved });
      setNote("");
      setId(crypto.randomUUID());
    }
    return after;
  }

  const [state, action, pending] = useActionState(save, START);

  return (
    <div className={styles.sideBySide}>
      <section className={shared.panel}>
        {head}
        {/* noValidate: the server says what is wrong, in the app's own words. */}
        <form onSubmit={(event) => sendForm(event, action)} noValidate>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="studentId" value={picked?.id ?? ""} />
          <span className={shared.label}>Mahasiswa</span>
          <StudentPicker
            picked={picked}
            onPick={pick}
            onClear={() => setPicked(null)}
          />
          {picked?.limit && <LimitNote text={limitNoteOf(picked.limit)} />}
          {picked && (
            <ScoreSliders
              scores={scores}
              levelTexts={levelTexts}
              onChange={change}
              highest={picked.limit ? CHARACTER_SCORE_CAP : SCORE_MAX}
            />
          )}
          <div className={shared.form}>
            <label className={`${shared.field} ${styles.full}`}>
              Sumber asesmen
              <select
                name="source"
                className={shared.input}
                defaultValue={ASSESSMENT_SOURCES[0]}
              >
                <SourceOptions />
              </select>
            </label>
            <label className={`${shared.field} ${styles.full}`}>
              Catatan penilai
              <textarea
                name="note"
                className={shared.input}
                maxLength={NOTE_MAX_LENGTH}
                placeholder="Dasar pemberian skor, contoh perilaku yang diamati"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            <div className={`${shared.actions} ${styles.full}`}>
              <button
                type="submit"
                className={shared.button}
                disabled={pending || picked === null}
              >
                Simpan asesmen
              </button>
              <FormMessage state={state} />
            </div>
          </div>
        </form>
      </section>
      <section className={shared.panel}>
        <MedalPreview picked={picked} scores={scores} />
      </section>
    </div>
  );
}
