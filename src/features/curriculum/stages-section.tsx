"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import styles from "./curriculum.module.css";
import type { PpksActivity } from "./ppks-activities";
import { PpksTable } from "./ppks-table";
import { type Parity, semesterOf, TAHAP } from "./stages";

const PARITIES: { parity: Parity; label: string; short: string }[] = [
  { parity: "odd", label: "Semester ganjil", short: "ganjil" },
  { parity: "even", label: "Semester genap", short: "genap" },
];

/**
 * The semester choice and the four tahap, with the PPKS activities of the
 * chosen semester below.
 */
export function StagesSection({ activities }: { activities: PpksActivity[] }) {
  const [parity, setParity] = useState<Parity>("odd");
  const [tahapNo, setTahapNo] = useState(1);
  const semester = semesterOf(tahapNo, parity);
  const tahap = TAHAP.find((candidate) => candidate.no === tahapNo);
  const half = PARITIES.find((choice) => choice.parity === parity);

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
            onClick={() => setTahapNo(tahap.no)}
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
      <section className={shared.panel}>
        <h2 className={shared.heading}>
          Program kegiatan PPKS semester {semester}
        </h2>
        <p className={shared.detail}>
          Tahap {tahap?.name.toLowerCase()}, semester {half?.short}. Daftar
          kegiatan tanpa tanggal.
        </p>
        <PpksTable
          activities={activities.filter(
            (activity) => activity.semester === semester,
          )}
        />
      </section>
    </section>
  );
}
