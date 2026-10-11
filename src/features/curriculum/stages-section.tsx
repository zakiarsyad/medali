"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { BreakdownPanel } from "./breakdown-panel";
import styles from "./curriculum.module.css";
import type { ValueIndicators } from "./main-indicators";
import type { PpksActivity } from "./ppks-activities";
import { PpksPanel } from "./ppks-panel";
import type { TahapBreakdown } from "./stage-breakdown";
import { type Parity, semesterOf, TAHAP } from "./stages";

const PARITIES: { parity: Parity; label: string; short: string }[] = [
  { parity: "odd", label: "Semester ganjil", short: "ganjil" },
  { parity: "even", label: "Semester genap", short: "genap" },
];

/**
 * The semester choice and the four tahap, with the PPKS activities of the
 * chosen semester and the breakdown of the chosen tahap below.
 */
export function StagesSection({
  tahapNo,
  onChoose,
  activities,
  breakdowns,
  values,
  mayChange,
  mayManage,
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
}) {
  const [parity, setParity] = useState<Parity>("odd");
  const semester = semesterOf(tahapNo, parity);
  const tahap = TAHAP.find((candidate) => candidate.no === tahapNo);
  const half = PARITIES.find((choice) => choice.parity === parity);
  const breakdown = breakdowns.find((shown) => shown.tahapNo === tahapNo);

  return (
    <section>
      <div className={styles.sectionHead}>
        <h2 className={shared.heading}>Tahapan dan program per semester</h2>
        <div className={styles.choice}>
          {PARITIES.map((choice) => (
            <button
              key={choice.parity}
              type="button"
              className={styles.choiceButton}
              aria-pressed={choice.parity === parity}
              onClick={() => setParity(choice.parity)}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.stages}>
        {TAHAP.map((tahap) => (
          <button
            key={tahap.no}
            type="button"
            className={styles.stageBox}
            aria-pressed={tahap.no === tahapNo}
            onClick={() => onChoose(tahap.no)}
          >
            <span className={styles.stageNo}>
              Tahap {tahap.no} · tingkat {tahap.no} · semester{" "}
              {semesterOf(tahap.no, parity)}
            </span>
            <span className={styles.stageName}>{tahap.name}</span>
            <span className={styles.stageText}>{tahap.description}</span>
          </button>
        ))}
      </div>
      {/* The key: an open form and its message belong to one semester. */}
      <PpksPanel
        key={semester}
        semester={semester}
        note={`Tahap ${tahap?.name.toLowerCase()}, semester ${half?.short}. Daftar kegiatan tanpa tanggal.`}
        activities={activities.filter(
          (activity) => activity.semester === semester,
        )}
        values={values}
        mayManage={mayManage}
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
        />
      )}
    </section>
  );
}
