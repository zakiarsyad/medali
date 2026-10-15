"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./leave.module.css";
import { decideLeaveAction } from "./leave-actions";
import { KindBadge } from "./leave-badges";
import { Fact } from "./leave-card-view";
import { KIND_WORDS, timeLabels } from "./leave-words";
import { TaskDecide } from "./task-decide";
import { type LeaveTask, NOTHING_WAITS } from "./tasks-card";

const APPROVE = { label: "Setujui", decision: "approve" };

/** What is asked before a request is rejected, such as Tolak Izin pesiar Ani, 14 Okt 2026, 09.00? */
export function rejectLeaveQuestion(task: LeaveTask): string {
  return `Tolak ${KIND_WORDS[task.kind]} ${task.name}, ${task.start}?`;
}

function LeaveTaskItem({
  task,
  onKept,
}: {
  task: LeaveTask;
  onKept: (answer: FormState) => void;
}) {
  const [refusal, setRefusal] = useState<string | null>(null);
  const labels = timeLabels(task.kind);

  function answered(answer: FormState) {
    if (answer.done) {
      onKept(answer);
      return;
    }
    setRefusal(answer.error);
  }

  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <b>{task.name}</b>
          <p className={styles.quietLine}>
            {task.nim} · {task.room}
          </p>
        </div>
        <div className={styles.badges}>
          <KindBadge kind={task.kind} />
        </div>
      </div>
      <dl className={styles.facts}>
        <Fact title={labels.start}>{task.start}</Fact>
        <Fact title={labels.end}>{task.end}</Fact>
        <Fact title="Keperluan">{task.purpose}</Fact>
        {task.destination !== "" && (
          <Fact title="Tujuan">{task.destination}</Fact>
        )}
      </dl>
      {task.startPassed && (
        <p className={styles.warning}>Waktu mulai sudah lewat.</p>
      )}
      <TaskDecide
        agree={APPROVE}
        question={rejectLeaveQuestion(task)}
        decide={(decision, note) => decideLeaveAction(task.id, decision, note)}
        onAnswer={answered}
      />
      <FormMessage state={{ error: refusal, done: null }} />
    </li>
  );
}

/**
 * The leave requests that wait, each with Catatan, "Setujui" and "Tolak",
 * the same decision as on Perizinan asrama. A kept decision takes the
 * request off the list, which the server reads again, and its answer
 * stays above the list, also once the list is empty; a refusal stays on
 * its card.
 */
export function LeaveTasks({ tasks }: { tasks: LeaveTask[] }) {
  const [kept, setKept] = useState<FormState | null>(null);
  return (
    <>
      {kept && <FormMessage state={kept} />}
      {tasks.length === 0 ? (
        <p className={shared.empty}>{NOTHING_WAITS}</p>
      ) : (
        <ul className={styles.cards}>
          {tasks.map((task) => (
            <LeaveTaskItem key={task.id} task={task} onKept={setKept} />
          ))}
        </ul>
      )}
    </>
  );
}
