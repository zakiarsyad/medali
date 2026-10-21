"use client";

import type { ReactNode } from "react";
import { weightTotal } from "@/character-grades/grade-letter";
import {
  GRADE_LETTERS,
  GRADE_PARTS,
  type GradePart,
  type GradeScheme,
  LIMITED_LETTERS,
  type LimitedLetter,
  WEIGHT_TOTAL,
} from "@/character-grades/scheme-ids";
import shared from "@/ui/data-screen.module.css";
import styles from "./character-grades.module.css";
import { limitField, PASS_LETTER_FIELD, weightField } from "./scheme-fields";
import type { SchemeFaults, SentScheme } from "./scheme-input";
import {
  barCells,
  formulaSentence,
  PART_LABELS,
  shownWeights,
} from "./scheme-words";

/** Takes the scheme as typed after each change. */
type OnType = (typed: SentScheme) => void;

function Fault({ fault }: { fault: string | null | undefined }) {
  if (!fault) return null;
  return <span className={styles.fault}>{fault}</span>;
}

function WeightBox({
  part,
  typed,
  fault,
  onType,
}: {
  part: GradePart;
  typed: SentScheme;
  fault: string | null | undefined;
  onType: OnType | undefined;
}) {
  const id = weightField(part);
  return (
    <div className={styles.weightBox}>
      <label htmlFor={id}>
        <span className={`${styles.swatch} ${styles[part]}`} />
        {PART_LABELS[part]}
      </label>
      <span className={styles.numberRow}>
        <input
          id={id}
          name={id}
          // Not a number box: what is no whole number stays to be read and corrected.
          inputMode="numeric"
          className={`${shared.input} ${styles.numberInput}`}
          value={typed.weights[part]}
          disabled={!onType}
          aria-invalid={Boolean(fault) || undefined}
          onChange={(event) =>
            onType?.({
              ...typed,
              weights: { ...typed.weights, [part]: event.target.value },
            })
          }
        />
        %
      </span>
      <Fault fault={fault} />
    </div>
  );
}

function LimitBox({
  letter,
  typed,
  fault,
  onType,
}: {
  letter: LimitedLetter;
  typed: SentScheme;
  fault: string | null | undefined;
  onType: OnType | undefined;
}) {
  return (
    <label className={styles.letterBox}>
      <b className={styles.letter}>{letter}</b>
      <input
        name={limitField(letter)}
        inputMode="numeric"
        className={`${shared.input} ${styles.numberInput}`}
        value={typed.lowerLimits[letter]}
        disabled={!onType}
        aria-label={`Batas bawah ${letter}`}
        aria-invalid={Boolean(fault) || undefined}
        onChange={(event) =>
          onType?.({
            ...typed,
            lowerLimits: { ...typed.lowerLimits, [letter]: event.target.value },
          })
        }
      />
      <Fault fault={fault} />
    </label>
  );
}

/** The shares of the four parts in one bar, coloured as the swatches of their fields. */
function SharesBar({ weights }: { weights: GradeScheme["weights"] }) {
  const shares = GRADE_PARTS.map(
    (part) => `${PART_LABELS[part]} ${weights[part]}%`,
  );
  return (
    <div className={styles.bar} role="img" aria-label={shares.join(", ")}>
      {barCells(weights).map((cell, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a cell is one percent of the bar, so its place is all that tells it apart.
        <span key={index} className={`${styles.cell} ${styles[cell]}`} />
      ))}
    </div>
  );
}

/**
 * "Skema bobot": the four weights with the bar of their shares, "Total
 * (n)%" and the sentence "Nilai akhir = …", the lower limit of each
 * letter, and "Batas lulus nilai karakter". Without `onType` every field
 * is switched off, for a role that only reads the scheme.
 */
export function SchemeView({
  typed,
  note,
  faults,
  onType,
  children,
}: {
  typed: SentScheme;
  /** Who set the scheme last and when, or that it is the starting one. */
  note: string;
  /** What is wrong with each field, for the form of Kepala Unit. */
  faults?: SchemeFaults;
  onType?: OnType;
  /** Under the fields: "Simpan skema", or the line for a role that only reads. */
  children: ReactNode;
}) {
  const weights = shownWeights(typed.weights);
  const total = weightTotal(weights);
  const totalLook =
    total === WEIGHT_TOTAL ? styles.totalRight : styles.totalWrong;
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={shared.heading}>Skema bobot</h2>
          <p className={styles.sub}>{note}</p>
        </div>
        <span className={`${shared.badge} ${totalLook}`}>Total {total}%</span>
      </div>
      <div className={styles.weights}>
        {GRADE_PARTS.map((part) => (
          <WeightBox
            key={part}
            part={part}
            typed={typed}
            fault={faults?.weights[part]}
            onType={onType}
          />
        ))}
      </div>
      <SharesBar weights={weights} />
      <p className={styles.sub}>{formulaSentence(weights)}</p>
      <span className={styles.subheading}>Konversi huruf (batas bawah)</span>
      <div className={styles.letters}>
        {LIMITED_LETTERS.map((letter) => (
          <LimitBox
            key={letter}
            letter={letter}
            typed={typed}
            fault={faults?.lowerLimits[letter]}
            onType={onType}
          />
        ))}
        <div className={styles.letterBox}>
          <b className={styles.letter}>E</b>
          <span>di bawah {typed.lowerLimits.D}</span>
        </div>
      </div>
      <Fault fault={faults?.order} />
      <label className={`${shared.field} ${styles.passField}`}>
        Batas lulus nilai karakter
        <select
          name={PASS_LETTER_FIELD}
          className={shared.input}
          value={typed.passLetter}
          disabled={!onType}
          onChange={(event) =>
            onType?.({ ...typed, passLetter: event.target.value })
          }
        >
          {GRADE_LETTERS.map((letter) => (
            <option key={letter}>{letter}</option>
          ))}
        </select>
      </label>
      {children}
    </section>
  );
}
