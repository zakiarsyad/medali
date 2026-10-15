import Link from "next/link";
import { NumberCard } from "@/ui/number-cards";
import type { OwnWarning } from "./own-warning";
import { RejectedTable } from "./rejected-table";
import { VIOLATIONS_ADDRESS } from "./violation-address";
import { letterMark, progressOf } from "./warning-rule";
import { callWords, causeWords, receivedWords } from "./warning-words";
import styles from "./warnings.module.css";

/**
 * The warning on Kegiatan asrama of a resident with a rejected
 * clarification or an SP in the running semester, as in the prototype:
 * how many were rejected, the SP they are called for, their SP, and
 * after SP 1 that one more rejection leads to SP 2. Nothing for others.
 */
export function ActivitiesWarning({ warning }: { warning: OwnWarning }) {
  const { standing } = warning;
  const mark = letterMark(standing);
  if (standing.rejected === 0 && mark === null) return null;
  const isOneFromSecond =
    standing.hasFirst && !standing.hasSecond && standing.level === null;
  return (
    <p className={styles.callBox}>
      {standing.rejected > 0 && (
        <>
          <b>{standing.rejected} klarifikasi kehadiran Anda ditolak</b> pada
          semester {warning.semesterTitle}.{" "}
        </>
      )}
      {standing.level !== null && (
        <>
          Anda masuk <b>penetapan SP {standing.level}</b> oleh Pengelola Asrama.{" "}
        </>
      )}
      {mark !== null && (
        <>
          Status saat ini: <b>SP {mark}</b>.{" "}
        </>
      )}
      {isOneFromSecond && <>{ONE_MORE_REJECTION} </>}
      <Link href={VIOLATIONS_ADDRESS}>Lihat di menu Pelanggaran</Link>
    </p>
  );
}

const ONE_MORE_REJECTION =
  "Satu kali lagi klarifikasi kehadiran ditolak akan memicu SP 2 dan pengajuan hukuman disiplin.";

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
