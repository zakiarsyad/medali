"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { NOT_SENT, sentOr } from "@/ui/save-not-sent";
import styles from "./leave.module.css";
import { decideLeaveAction } from "./leave-actions";
import type { LeaveCard } from "./leave-card";
import { LeaveCardView } from "./leave-card-view";
import { DECISION_NOTE_MAX_LENGTH } from "./leave-ids";
import { isOwnRecord } from "./own-record";
import { OwnRecordNote } from "./own-record-note";
import { RecordReturnForm } from "./record-return-form";
import { ReturnDecide } from "./return-decide";
import type { DecidedStatus } from "./return-messages";
import { ReturnReportView } from "./return-report-view";

/** What the signed-in account may do on the cards. */
export interface LeaveRights {
  /** Approve and reject requests: Pengelola Asrama. */
  decide: boolean;
  /** Verify and reject reports of a return: BAM - BPHK. */
  verify: boolean;
  /** Validate and reject reports BAM verified: Pengelola Asrama. */
  validate: boolean;
  /** Record a return directly: Pengelola Asrama and BAM - BPHK. */
  record: boolean;
}

/** What the server answered to the last decision made on a card. */
interface Answer<Status> {
  state: FormState;
  /** What the decision made the request or report, when it was kept. */
  decided: Status | null;
}

/** Catatan, "Setujui" and "Tolak" on a card that waits. */
function LeaveDecide({
  id,
  onAnswer,
}: {
  id: string;
  onAnswer: (answer: Answer<"approved" | "rejected">) => void;
}) {
  const [note, setNote] = useState("");
  const [pending, startSending] = useTransition();

  function send(decision: "approve" | "reject") {
    startSending(async () => {
      const state = await sentOr(
        () => decideLeaveAction(id, decision, note),
        NOT_SENT,
      );
      const status = decision === "approve" ? "approved" : "rejected";
      onAnswer({ state, decided: state.done ? status : null });
    });
  }

  return (
    <div className={styles.decide}>
      <input
        className={shared.input}
        aria-label="Catatan"
        placeholder="Catatan (wajib bila ditolak)"
        maxLength={DECISION_NOTE_MAX_LENGTH}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <button
        type="button"
        className={shared.button}
        disabled={pending}
        onClick={() => send("approve")}
      >
        Setujui
      </button>
      <button
        type="button"
        className={shared.quiet}
        disabled={pending}
        onClick={() => send("reject")}
      >
        Tolak
      </button>
    </div>
  );
}

/** What was kept of the decisions made on a card here. */
export interface DoneHere {
  leave: "approved" | "rejected" | null;
  report: DecidedStatus | null;
  /** Whether "Catat sudah kembali" was kept. */
  recorded: boolean;
}

/**
 * The card as the decisions made on it here left it: a decided request
 * has its new status and no warning, a decided report its new status,
 * and leave whose report was validated or whose return was recorded is
 * Selesai, and no longer out.
 */
export function cardAfter(card: LeaveCard, done: DoneHere): LeaveCard {
  let shown = card;
  if (done.leave !== null) {
    shown = { ...shown, status: done.leave, warnings: [] };
  }
  if (done.report !== null && shown.report !== null) {
    shown = { ...shown, report: { ...shown.report, status: done.report } };
  }
  if (done.report === "validated" || done.recorded) {
    shown = { ...shown, status: "completed", isOut: false };
  }
  return shown;
}

/** What a card offers to do with its report of a return, by who looks. */
function ReportChecks({
  card,
  rights,
  isOwn,
  onAnswer,
}: {
  card: LeaveCard;
  rights: LeaveRights;
  isOwn: boolean;
  onAnswer: (answer: Answer<DecidedStatus>) => void;
}) {
  const status = card.report?.status;
  const reportId = card.report?.id;
  if (reportId === undefined) return null;
  const answer = (state: FormState, decided: DecidedStatus | null) =>
    onAnswer({ state, decided });
  if (rights.verify && status === "waiting") {
    if (isOwn) return <OwnRecordNote />;
    return (
      <ReturnDecide reportId={reportId} check="verify" onAnswer={answer} />
    );
  }
  if (rights.validate && status === "verified") {
    return (
      <ReturnDecide reportId={reportId} check="validate" onAnswer={answer} />
    );
  }
  if (rights.validate && status === "waiting") {
    return (
      <p className={styles.quietLine}>
        Menunggu verifikasi Badan Asrama Mahasiswa.
      </p>
    );
  }
  return null;
}

/** What a card offers on leave that is out: "Catat sudah kembali", or not on the account's own. */
function RecordReturn({
  card,
  isOwn,
  asOf,
  onAnswer,
}: {
  card: LeaveCard;
  isOwn: boolean;
  asOf: string;
  onAnswer: (answer: FormState) => void;
}) {
  if (isOwn) return <OwnRecordNote />;
  return (
    <RecordReturnForm
      leaveId={card.id}
      end={card.end}
      isLate={card.isLate}
      asOf={asOf}
      onAnswer={onAnswer}
    />
  );
}

function LeaveCardItem({
  card,
  rights,
  ownStudentId,
  asOf,
}: {
  card: LeaveCard;
  rights: LeaveRights;
  ownStudentId: string | null;
  asOf: string;
}) {
  const isOwn = isOwnRecord(ownStudentId, card.studentId);
  const [leaveAnswer, setLeaveAnswer] = useState<Answer<
    "approved" | "rejected"
  > | null>(null);
  const [reportAnswer, setReportAnswer] =
    useState<Answer<DecidedStatus> | null>(null);
  const [recordAnswer, setRecordAnswer] = useState<FormState | null>(null);
  const shown = cardAfter(card, {
    leave: leaveAnswer?.decided ?? null,
    report: reportAnswer?.decided ?? null,
    recorded: Boolean(recordAnswer?.done),
  });
  return (
    <LeaveCardView card={shown}>
      {rights.decide && shown.status === "submitted" && (
        <LeaveDecide id={card.id} onAnswer={setLeaveAnswer} />
      )}
      {leaveAnswer && <FormMessage state={leaveAnswer.state} />}
      {rights.record && shown.isOut && (
        <RecordReturn
          card={card}
          isOwn={isOwn}
          asOf={asOf}
          onAnswer={setRecordAnswer}
        />
      )}
      {recordAnswer && <FormMessage state={recordAnswer} />}
      {shown.report && (
        <ReturnReportView report={shown.report}>
          <ReportChecks
            card={shown}
            rights={rights}
            isOwn={isOwn}
            onAnswer={setReportAnswer}
          />
          {reportAnswer && <FormMessage state={reportAnswer.state} />}
        </ReturnReportView>
      )}
    </LeaveCardView>
  );
}

/**
 * The request cards of one page, as they were read when the page opened:
 * a card decided here stays in its place with its new status and the
 * answer under it, also once the list it came from no longer holds it.
 * A card that waits offers Catatan, "Setujui" and "Tolak" to an account
 * that may decide, and a report of a return the checks of the account's
 * roles, except on the account's own leave. It is made anew for each
 * address.
 */
export function LeaveCards({
  cards,
  rights,
  ownStudentId,
  asOf,
  emptyWords,
}: {
  cards: LeaveCard[];
  rights: LeaveRights;
  /** The student the account belongs to, or null. */
  ownStudentId: string | null;
  /** The moment the page was read, as a time on campus. */
  asOf: string;
  /** What is said when there is no card to show. */
  emptyWords: string;
}) {
  const [shown] = useState(cards);

  if (shown.length === 0) return <p className={shared.empty}>{emptyWords}</p>;
  return (
    <ul className={styles.cards}>
      {shown.map((card) => (
        <LeaveCardItem
          key={card.id}
          card={card}
          rights={rights}
          ownStudentId={ownStudentId}
          asOf={asOf}
        />
      ))}
    </ul>
  );
}
