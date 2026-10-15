import { NumberCard } from "@/ui/number-cards";
import type { OwnWarning } from "./own-warning";
import { RejectedTable } from "./rejected-table";
import { progressOf } from "./warning-rule";
import { callWords, causeWords, receivedWords } from "./warning-words";
import styles from "./warnings.module.css";

/** "Menuju panggilan SP 1" or "Menuju SP 2", with the count, among the resident's numbers. */
export function WarningProgressCard({ warning }: { warning: OwnWarning }) {
  const progress = progressOf(warning.standing);
  return (
    <NumberCard
      label={progress.label}
      amount={progress.amount}
      note={progress.note}
    />
  );
}

/**
 * What the resident is told of an SP in the running semester: their
 * rejected clarifications, the box "Penetapan SP" with the cause and the
 * call, and "Anda menerima Surat Peringatan" for each SP received.
 * Nothing shows for a resident with none of them.
 */
export function OwnWarningBoxes({ warning }: { warning: OwnWarning }) {
  const { level } = warning.standing;
  const hasBoxes = level !== null || warning.letters.length > 0;
  return (
    <>
      <RejectedTable rows={warning.rejected} />
      {hasBoxes && (
        <div className={styles.boxes}>
          {level !== null && (
            <p className={styles.callBox}>
              <b>Penetapan SP {level}.</b> Dasar: {causeWords(warning.causes)}{" "}
              pada semester {warning.semesterTitle}.{" "}
              {callWords(warning.schedule)}
            </p>
          )}
          {warning.letters.map((letter) => (
            <p key={letter.level} className={styles.box}>
              Anda menerima <b>Surat Peringatan {letter.level}</b>{" "}
              {receivedWords(letter)}
            </p>
          ))}
        </div>
      )}
    </>
  );
}
