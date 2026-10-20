"use client";

import { type FormEvent, useState, useTransition } from "react";
import type { Parsed } from "@/parsed";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { ConsentStatusLine } from "./consent-badge";
import type { ConsentPick } from "./consent-picks";
import { ConsentStudentPicker } from "./consent-student-picker";
import type { ConsentView } from "./consent-view";
import styles from "./counselling.module.css";
import {
  lookUpScreeningConsentAction,
  saveScreeningAction,
  searchScreeningStudentsAction,
} from "./screening-actions";
import { ScreeningEvaluation } from "./screening-evaluation";
import {
  DASS_SUM_MAX,
  INSTRUMENTS,
  type Instrument,
  SCREENING_NOTE_MAX,
  SRQ_MAX,
} from "./screening-ids";
import { checkScreening, type SentScreening } from "./screening-input";
import { DASS_SCALES } from "./screening-rules";
import {
  CONSENT_FIRST,
  INSTRUMENT_WORDS,
  SCALE_WORDS,
  SELF_HARM_WORDS,
  SRQ_FIELD,
} from "./screening-words";

const NO_MESSAGE: FormState = { error: null, done: null };

type Sums = Pick<SentScreening, "depression" | "anxiety" | "stress" | "srqYes">;

const ZERO_SUMS: Sums = {
  depression: "0",
  anxiety: "0",
  stress: "0",
  srqYes: "0",
};

function isInstrument(value: string): value is Instrument {
  return INSTRUMENTS.some((instrument) => instrument === value);
}

function SumField({
  label,
  most,
  value,
  onChange,
}: {
  label: string;
  most: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={shared.field}>
      {label}
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={most}
        step={1}
        className={shared.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ScoreFields({
  instrument,
  sums,
  onChange,
}: {
  instrument: Instrument;
  sums: Sums;
  onChange: (sums: Sums) => void;
}) {
  if (instrument === "srq20") {
    return (
      <div className={styles.full}>
        <SumField
          label={`${SRQ_FIELD} (0–${SRQ_MAX})`}
          most={SRQ_MAX}
          value={sums.srqYes}
          onChange={(srqYes) => onChange({ ...sums, srqYes })}
        />
        <p className={styles.sub}>
          Skor 6 atau lebih menandakan perlu evaluasi lanjut.
        </p>
      </div>
    );
  }
  return (
    <div className={`${styles.full} ${styles.stack}`}>
      <div className={shared.form}>
        {DASS_SCALES.map((scale) => (
          <SumField
            key={scale}
            label={`${SCALE_WORDS[scale]} (jumlah 7 butir, 0–${DASS_SUM_MAX})`}
            most={DASS_SUM_MAX}
            value={sums[scale]}
            onChange={(sum) => onChange({ ...sums, [scale]: sum })}
          />
        ))}
      </div>
      <p className={styles.sub}>
        Skor dikali dua sebelum dibandingkan dengan batas tingkat keparahan
        DASS-21.
      </p>
    </div>
  );
}

export function ConsentPart({
  looked,
}: {
  looked: Parsed<ConsentView | null> | null;
}) {
  if (looked === null) return null;
  if (!looked.ok) return <p className={shared.error}>{looked.error}</p>;
  if (looked.value?.status === "approved") {
    return <ConsentStatusLine consent={looked.value} />;
  }
  return (
    <div className={styles.warnBox} role="note">
      <ConsentStatusLine consent={looked.value} />
      <p>{CONSENT_FIRST}</p>
    </div>
  );
}

/**
 * "Asesmen kesehatan mental" of Konselor: the student, "Tanggal asesmen",
 * "Instrumen" and its scores, the self-harm tick, the level and advice
 * as they are typed, and "Catatan konselor (rahasia)". "Simpan asesmen"
 * cannot be pressed while the student's consent is not Disetujui.
 * `newKey` names this filling of the form, so a form sent twice is kept
 * once; the page gives a new one after each save.
 */
export function ScreeningForm({
  today,
  newKey,
}: {
  today: string;
  newKey: string;
}) {
  const [picked, setPicked] = useState<ConsentPick | null>(null);
  const [looked, setLooked] = useState<Parsed<ConsentView | null> | null>(null);
  const [instrument, setInstrument] = useState<Instrument>("dass21");
  const [sums, setSums] = useState<Sums>(ZERO_SUMS);
  const [selfHarm, setSelfHarm] = useState(false);
  const [message, setMessage] = useState<FormState>(NO_MESSAGE);
  const [pending, startSending] = useTransition();

  function pick(student: ConsentPick) {
    setPicked(student);
    setLooked(null);
    setMessage(NO_MESSAGE);
    startSending(async () => {
      setLooked(await lookUpScreeningConsentAction(student.id));
    });
  }

  function clear() {
    setPicked(null);
    setLooked(null);
    setMessage(NO_MESSAGE);
  }

  const waitsForConsent =
    picked !== null &&
    (looked === null || !looked.ok || looked.value?.status !== "approved");

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const sent: SentScreening = {
      studentId: picked?.id ?? "",
      screenedOn: String(fields.get("screenedOn") ?? ""),
      instrument,
      ...sums,
      selfHarm,
      note: String(fields.get("note") ?? ""),
    };
    const checked = checkScreening(sent, today);
    if (!checked.ok) {
      setMessage({ error: checked.error, done: null });
      return;
    }
    startSending(async () => {
      const outcome = await saveScreeningAction(newKey, sent);
      setMessage(outcome);
      if (outcome.done !== null) {
        form.reset();
        setSelfHarm(false);
      }
    });
  }

  return (
    <section className={`${shared.panel} ${styles.stack}`}>
      <h2 className={shared.heading}>Asesmen kesehatan mental</h2>
      {/* noValidate: a wrong number or date gets the app's own message. */}
      <form onSubmit={send} className={shared.form} noValidate>
        <div className={`${styles.full} ${styles.stack}`}>
          <span className={shared.field}>Mahasiswa</span>
          <ConsentStudentPicker
            picked={picked}
            onPick={pick}
            onClear={clear}
            search={searchScreeningStudentsAction}
          />
          <ConsentPart looked={looked} />
        </div>
        <label className={shared.field}>
          Tanggal asesmen
          <input
            name="screenedOn"
            type="date"
            className={shared.input}
            max={today}
            defaultValue={today}
          />
        </label>
        <label className={shared.field}>
          Instrumen
          <select
            className={shared.input}
            value={instrument}
            onChange={(event) => {
              if (isInstrument(event.target.value)) {
                setInstrument(event.target.value);
              }
            }}
          >
            {INSTRUMENTS.map((each) => (
              <option key={each} value={each}>
                {INSTRUMENT_WORDS[each]}
              </option>
            ))}
          </select>
        </label>
        <ScoreFields instrument={instrument} sums={sums} onChange={setSums} />
        <label className={`${styles.tick} ${styles.full}`}>
          <input
            type="checkbox"
            checked={selfHarm}
            onChange={(event) => setSelfHarm(event.target.checked)}
          />
          <span>{SELF_HARM_WORDS}</span>
        </label>
        <div className={styles.full}>
          <ScreeningEvaluation sent={{ instrument, ...sums, selfHarm }} />
        </div>
        <label className={`${shared.field} ${styles.full}`}>
          Catatan konselor (rahasia)
          <textarea
            name="note"
            rows={3}
            maxLength={SCREENING_NOTE_MAX}
            className={shared.input}
            placeholder="Hanya dapat dibaca konselor"
          />
        </label>
        <div className={`${shared.actions} ${styles.full}`}>
          <button
            type="submit"
            className={shared.button}
            disabled={pending || waitsForConsent}
          >
            Simpan asesmen
          </button>
        </div>
        <div className={styles.full}>
          <FormMessage state={message} />
        </div>
      </form>
    </section>
  );
}
