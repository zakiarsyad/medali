"use client";

import type { FormState } from "@/ui/form-message";
import styles from "./leave.module.css";
import { validateReturnAction } from "./leave-actions";
import { KindBadge } from "./leave-badges";
import { Fact } from "./leave-card-view";
import { ReturnPhoto } from "./return-report-view";
import { TaskCards } from "./task-cards";
import { TaskDecide } from "./task-decide";
import own from "./tasks.module.css";
import type { ReturnTask } from "./tasks-card";

const VALIDATE = { label: "Validasi kembali", decision: "validate" };

/** What is asked before a report is rejected, such as Tolak laporan kembali Ani, 14 Okt 2026, 16.12? */
export function rejectReturnQuestion(task: ReturnTask): string {
  return `Tolak laporan kembali ${task.name}, ${task.reportedAt}?`;
}

/** When the report was sent, with how late, such as 14 Okt 2026, 16.12 · terlambat 12 menit. */
export function reportedWords(task: ReturnTask): string {
  if (task.lateMinutes === 0) return task.reportedAt;
  return `${task.reportedAt} · terlambat ${task.lateMinutes} menit`;
}

function ReturnTaskCard({
  task,
  onKept,
}: {
  task: ReturnTask;
  onKept: (answer: FormState) => void;
}) {
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
        <Fact title="Batas kembali">{task.deadline}</Fact>
        <Fact title="Lapor">
          <span className={task.lateMinutes > 0 ? own.late : undefined}>
            {reportedWords(task)}
          </span>
        </Fact>
        {task.bamNote !== "" && <Fact title="Catatan BAM">{task.bamNote}</Fact>}
      </dl>
      <div className={own.photo}>
        <ReturnPhoto report={{ id: task.reportId, hasPhoto: task.hasPhoto }} />
      </div>
      <TaskDecide
        agree={VALIDATE}
        question={rejectReturnQuestion(task)}
        decide={(decision, note) =>
          validateReturnAction(task.reportId, decision, note)
        }
        onKept={onKept}
      />
    </>
  );
}

/**
 * The reports of a return that BAM - BPHK verified, each with its photo,
 * Catatan, "Validasi kembali" and "Tolak": the same decision as on
 * Perizinan asrama.
 */
export function ReturnTasks({ tasks }: { tasks: ReturnTask[] }) {
  return (
    <TaskCards
      items={tasks}
      keyOf={(task) => task.reportId}
      cardOf={(task, onKept) => <ReturnTaskCard task={task} onKept={onKept} />}
    />
  );
}
