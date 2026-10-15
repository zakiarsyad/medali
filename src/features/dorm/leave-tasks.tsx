"use client";

import type { FormState } from "@/ui/form-message";
import styles from "./leave.module.css";
import { decideLeaveAction } from "./leave-actions";
import { KindBadge } from "./leave-badges";
import { Fact } from "./leave-card-view";
import { KIND_WORDS, timeLabels } from "./leave-words";
import { TaskCards } from "./task-cards";
import { TaskDecide } from "./task-decide";
import type { LeaveTask } from "./tasks-card";

const APPROVE = [{ label: "Setujui", decision: "approve" }];

/** What is asked before a request is rejected, such as Tolak Izin pesiar Ani, 14 Okt 2026, 09.00? */
export function rejectLeaveQuestion(task: LeaveTask): string {
  return `Tolak ${KIND_WORDS[task.kind]} ${task.name}, ${task.start}?`;
}

function LeaveTaskCard({
  task,
  onSettled,
}: {
  task: LeaveTask;
  onSettled: (said: FormState) => void;
}) {
  const labels = timeLabels(task.kind);
  return (
    <>
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
        agrees={APPROVE}
        question={rejectLeaveQuestion(task)}
        decide={(decision, note) => decideLeaveAction(task.id, decision, note)}
        onSettled={onSettled}
      />
    </>
  );
}

/**
 * The leave requests that wait, each with Catatan, "Setujui" and "Tolak":
 * the same decision as on Perizinan asrama.
 */
export function LeaveTasks({ tasks }: { tasks: LeaveTask[] }) {
  return (
    <TaskCards
      items={tasks}
      keyOf={(task) => task.id}
      cardOf={(task, onSettled) => (
        <LeaveTaskCard task={task} onSettled={onSettled} />
      )}
    />
  );
}
