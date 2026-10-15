"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { shownDay, shownMoment } from "@/ui/day";
import { FormMessage, type FormState } from "@/ui/form-message";
import { AppealDecide } from "./appeal-decide";
import type { AppealCard } from "./appeal-inbox";
import { appealProofAddress } from "./violation-address";
import { punishmentText } from "./violation-words";
import styles from "./violations.module.css";

const START: FormState = { error: null, done: null };

export const OWN_APPEAL_NOTE =
  "Advokasi atas pelanggaran Anda sendiri diputuskan oleh anggota BAM yang lain.";

function AppealCardView({
  card,
  isOwn,
  onAnswer,
}: {
  card: AppealCard;
  isOwn: boolean;
  onAnswer: (answer: FormState) => void;
}) {
  return (
    <article className={styles.card}>
      <b className={shared.typed}>{card.name}</b>
      <span className={shared.detail}>
        {card.nim} · diajukan {shownMoment(card.sentAt)}
      </span>
      <p className={shared.detail}>
        Pelanggaran {shownDay(card.violationDay)}:{" "}
        <b className={shared.typed}>{card.violationReason}</b> ·{" "}
        {punishmentText(card.punishment, card.otherPunishment)}
      </p>
      <p className={shared.typed}>{card.reason}</p>
      {card.proofName !== null && (
        <a
          href={appealProofAddress(card.id)}
          className={`${shared.link} ${shared.typed}`}
        >
          Lihat bukti: {card.proofName}
        </a>
      )}
      {isOwn ? (
        <p className={shared.detail}>{OWN_APPEAL_NOTE}</p>
      ) : (
        <AppealDecide appealId={card.id} name={card.name} onAnswer={onAnswer} />
      )}
    </article>
  );
}

/**
 * The cards of one page of "Advokasi masuk": the student, the
 * violation, the reason, the proof to open, and "Catatan BAM", "Terima"
 * and "Tolak", but not on an appeal of the decider's own violation. The
 * answer to a decision stays above the cards, since a decided card
 * leaves the list.
 */
export function AppealCards({
  cards,
  ownStudentId,
}: {
  cards: readonly AppealCard[];
  /** The student the decider's account belongs to, or null. */
  ownStudentId: string | null;
}) {
  const [answer, setAnswer] = useState(START);
  return (
    <>
      <FormMessage state={answer} />
      <div className={styles.cards}>
        {cards.map((card) => (
          <AppealCardView
            key={card.id}
            card={card}
            isOwn={card.studentId === ownStudentId}
            onAnswer={setAnswer}
          />
        ))}
      </div>
    </>
  );
}
