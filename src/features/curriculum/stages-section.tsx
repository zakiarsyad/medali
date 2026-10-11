"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import styles from "./curriculum.module.css";
import { type Parity, semesterOf, TAHAP } from "./stages";

const PARITIES: { parity: Parity; label: string }[] = [
  { parity: "odd", label: "Semester ganjil" },
  { parity: "even", label: "Semester genap" },
];

/** The semester choice and the four tahap, one of them chosen. */
export function StagesSection() {
  const [parity, setParity] = useState<Parity>("odd");
  const [tahapNo, setTahapNo] = useState(1);

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
    </section>
  );
}
