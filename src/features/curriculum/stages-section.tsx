"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { ModeSwitch } from "@/ui/mode-switch";
import { BreakdownPanel } from "./breakdown-panel";
import styles from "./curriculum.module.css";
import type { ValueIndicators } from "./main-indicators";
import type { PpksActivity } from "./ppks-activities";
import { type FormTarget, PpksPanel } from "./ppks-panel";
import type { TahapBreakdown } from "./stage-breakdown";
import { type Parity, semesterOf, TAHAP } from "./stages";
import { autoTarget, type SemesterCounts, tahapCount } from "./student-numbers";
import type { TahapScores } from "./tahap-scores";

const PARITIES: { parity: Parity; label: string; short: string }[] = [
  { parity: "odd", label: "Semester ganjil", short: "ganjil" },
  { parity: "even", label: "Semester genap", short: "genap" },
];

const PARITY_MODES = PARITIES.map(
  (choice) => [choice.parity, choice.label] as const,
);

const SPECIAL_NOTE =
  "Daftar kegiatan di luar PPKS. Setelah terdaftar di sini, kegiatan dapat dijadwalkan di menu Kegiatan karakter untuk mahasiswa tertentu, kelas, angkatan, atau lintas angkatan.";

/**
 * The one activity form open on the page: the list it belongs to, by its
 * semester or by none, and what it is open for.
 */
interface OpenForm {
  semester: number | null;
  target: FormTarget;
}

function isSameTarget(one: FormTarget, other: FormTarget): boolean {
  if (one === "new" || other === "new") return one === other;
  return one.id === other.id;
}

/**
 * The semester choice and the four tahap, with the PPKS activities of the
 * chosen semester and the breakdown of the chosen tahap below. The special
 * and additional activities come last: they follow no semester or tahap.
 * Both lists of activities share one open form, so only one is open at a
 * time.
 */
export function StagesSection({
  tahapNo,
  onChoose,
  activities,
  breakdowns,
  values,
  mayChange,
  mayManage,
  newActivityId,
  semesterCounts,
  scores,
}: {
  /** The chosen tahap, from 1 to 4. */
  tahapNo: number;
  onChoose: (tahapNo: number) => void;
  activities: PpksActivity[];
  /** The breakdown of each of the four tahap. */
  breakdowns: TahapBreakdown[];
  /** Every nilai with its main indicators as they are now. */
  values: ValueIndicators[];
  mayChange: boolean;
  mayManage: boolean;
  /** The key for the next activity a form adds. */
  newActivityId: string;
  /** The active students of every program in each semester. */
  semesterCounts: SemesterCounts;
  /**
   * The averages of the viewer's assessed students in each tahap, from
   * tahap 1 to 4, or null for a tahap with none.
   */
  scores: readonly (TahapScores | null)[];
}) {
  const [parity, setParity] = useState<Parity>("odd");
  const semester = semesterOf(tahapNo, parity);
  const tahap = TAHAP.find((candidate) => candidate.no === tahapNo);
  const half = PARITIES.find((choice) => choice.parity === parity);
  const breakdown = breakdowns.find((shown) => shown.tahapNo === tahapNo);
  const [open, setOpen] = useState<OpenForm | null>(null);

  // The form of a semester goes with its semester, so a press that keeps
  // the semester keeps the form. The form of the special activities stays:
  // they follow no semester.
  function show(nextTahapNo: number, nextParity: Parity) {
    const leavesSemester = semesterOf(nextTahapNo, nextParity) !== semester;
    if (leavesSemester && open && open.semester !== null) setOpen(null);
    setParity(nextParity);
    onChoose(nextTahapNo);
  }

  /** What the list of one semester, or of the special activities, is given. */
  function listOf(listSemester: number | null) {
    return {
      semester: listSemester,
      autoTarget:
        listSemester === null ? null : autoTarget(semesterCounts, listSemester),
      activities: activities.filter(
        (activity) => activity.semester === listSemester,
      ),
      values,
      mayManage,
      newActivityId,
      open: open?.semester === listSemester ? open.target : null,
      isFormOpen: open !== null,
      // "Ubah" on the row whose form is open already keeps that opening, so
      // an answer on its way still closes it.
      onOpen: (target: FormTarget) =>
        setOpen((now) =>
          now?.semester === listSemester && isSameTarget(now.target, target)
            ? now
            : { semester: listSemester, target },
        ),
      // Only while it is still the form that asked: an answer that comes
      // late must not close a form opened since.
      onClose: () => setOpen((now) => (now === open ? null : now)),
    };
  }

  return (
    <section>
      <div className={styles.sectionHead}>
        <h2 className={shared.heading}>Tahapan dan program per semester</h2>
        <ModeSwitch
          legend="Semester"
          modes={PARITY_MODES}
          mode={parity}
          onChoose={(next) => show(tahapNo, next)}
        />
      </div>
      <div className={styles.stages}>
        {TAHAP.map((tahap) => (
          <button
            key={tahap.no}
            type="button"
            className={styles.stageBox}
            aria-pressed={tahap.no === tahapNo}
            onClick={() => show(tahap.no, parity)}
          >
            <span className={styles.stageNo}>
              Tahap {tahap.no} · tingkat {tahap.no} · semester{" "}
              {semesterOf(tahap.no, parity)}
            </span>
            <span className={styles.stageName}>{tahap.name}</span>
            <span className={styles.stageText}>{tahap.description}</span>
            <span className={styles.stageCount}>
              {tahapCount(semesterCounts, tahap.no).toLocaleString("id-ID")}{" "}
              mahasiswa aktif
            </span>
          </button>
        ))}
      </div>
      {/* The key: an open form and its message belong to one semester. */}
      <PpksPanel
        key={semester}
        {...listOf(semester)}
        note={`Tahap ${tahap?.name.toLowerCase()}, semester ${half?.short}. Daftar kegiatan tanpa tanggal.`}
      />
      {/* The key: an open form and its message belong to one tahap. It is
          named, so it never equals the semester key of the panel above. */}
      {tahap && breakdown && (
        <BreakdownPanel
          key={`tahap-${tahapNo}`}
          tahapName={tahap.name}
          breakdown={breakdown}
          values={values}
          mayChange={mayChange}
          scores={scores[tahapNo - 1] ?? null}
        />
      )}
      <PpksPanel key="special" {...listOf(null)} note={SPECIAL_NOTE} />
    </section>
  );
}
