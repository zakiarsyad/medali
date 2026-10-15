"use client";

import { useState } from "react";
import { ClarificationFileDialog } from "@/clarifications/clarification-file-dialog";
import { decideDormClarificationAction } from "./clarification-actions";
import { clarificationFileAddress } from "./clarification-address";
import { ClarificationCardView } from "./clarification-card-view";
import { KIND_WORDS } from "./clarification-decision";
import { CLARIFICATION_NOTE_MAX_LENGTH } from "./clarification-ids";
import styles from "./leave.module.css";
import { TaskItems } from "./task-cards";
import { TaskDecide } from "./task-decide";
import type { ClarificationTask } from "./tasks-card";

const ACCEPT = [
  { label: KIND_WORDS.decide.present ?? "", decision: "present" },
  { label: KIND_WORDS.decide.leave ?? "", decision: "leave" },
];

/**
 * What is asked before a clarification is rejected, such as Tolak
 * klarifikasi Ani, Apel pagi, 12 Okt 2026, 05.00–06.00?
 */
export function rejectClarificationQuestion(task: ClarificationTask): string {
  return `Tolak klarifikasi ${task.name}, ${task.activity}, ${task.held}?`;
}

/**
 * The clarifications BAM passed on, each as its card on Klarifikasi
 * kehadiran, with Catatan, "Terima sebagai hadir", "Terima sebagai izin"
 * and "Tolak": the same decision as there. A press on a file name opens
 * the file over the page.
 */
export function ClarificationTasks({ tasks }: { tasks: ClarificationTask[] }) {
  const [opened, setOpened] = useState<ClarificationTask | null>(null);
  return (
    <>
      <TaskItems isEmpty={tasks.length === 0}>
        {(onSettled) => (
          <ul className={styles.cards}>
            {tasks.map((task) => (
              <ClarificationCardView
                key={task.id}
                card={task}
                onOpenFile={() => setOpened(task)}
              >
                <TaskDecide
                  agrees={ACCEPT}
                  question={rejectClarificationQuestion(task)}
                  noteMaxLength={CLARIFICATION_NOTE_MAX_LENGTH}
                  decide={(decision, note) =>
                    decideDormClarificationAction(task.id, decision, note)
                  }
                  onSettled={onSettled}
                />
              </ClarificationCardView>
            ))}
          </ul>
        )}
      </TaskItems>
      {opened?.file && (
        <ClarificationFileDialog
          key={opened.id}
          file={opened.file}
          addressOf={(isShown) => clarificationFileAddress(opened.id, isShown)}
          onClose={() => setOpened(null)}
        />
      )}
    </>
  );
}
