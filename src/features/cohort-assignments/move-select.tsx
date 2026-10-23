"use client";

import type { ChangeEvent } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { moveMemberAction } from "./actions";
import { changeForm } from "./change-form";
import styles from "./cohort-assignments.module.css";
import type { DraftKey } from "./draft-change-input";
import { useChangeAnswer, useOneSave } from "./one-save";

/** A group a member may move to. */
export interface MoveTarget {
  id: string;
  code: string;
}

/**
 * "Pindahkan ke…": the other groups of the member's program studi and
 * jalur. The member moves as soon as one is chosen.
 */
export function MoveSelect({
  shown,
  studentId,
  studentName,
  targets,
}: {
  /** The draft the member is shown with. */
  shown: DraftKey;
  studentId: string;
  /** For a screen reader. */
  studentName: string;
  targets: MoveTarget[];
}) {
  const [state, sendChange] = useChangeAnswer(moveMemberAction);
  const { isSaving, save } = useOneSave();

  function move(event: ChangeEvent<HTMLSelectElement>) {
    const toGroupId = event.target.value;
    if (toGroupId === "") return;
    save(() => sendChange(changeForm(shown, { studentId, toGroupId })));
  }

  return (
    <div>
      <select
        className={`${shared.input} ${styles.fit}`}
        value=""
        onChange={move}
        disabled={isSaving}
        aria-label={`Pindahkan ${studentName}`}
      >
        <option value="">Pindahkan ke…</option>
        {targets.map((target) => (
          <option key={target.id} value={target.id}>
            {target.code}
          </option>
        ))}
      </select>
      <FormMessage state={state} />
    </div>
  );
}
