"use client";

import { type ChangeEvent, useOptimistic } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { chooseMentorAction } from "./actions";
import { changeForm } from "./change-form";
import styles from "./cohort-assignments.module.css";
import type { DraftKey } from "./draft-change-input";
import type { MentorOption } from "./mentor-options";
import { useChangeAnswer, useOneSave } from "./one-save";

/**
 * The choice of a mentor for one group, saved as soon as it is made. It
 * shows what was picked while that is saved, and then what the draft
 * holds: after a refusal that is the mentor the group had.
 */
export function MentorSelect({
  shown,
  groupId,
  groupCode,
  chosenId,
  options,
}: {
  /** The draft the choice is shown with. */
  shown: DraftKey;
  groupId: string;
  /** The code of the group, for a screen reader. */
  groupCode: string;
  chosenId: string | null;
  options: MentorOption[];
}) {
  const [state, sendChange] = useChangeAnswer(chooseMentorAction);
  const { isSaving, save } = useOneSave();
  const [picked, showPicked] = useOptimistic(chosenId ?? "");

  function choose(event: ChangeEvent<HTMLSelectElement>) {
    const mentorId = event.target.value;
    save(async () => {
      showPicked(mentorId);
      await sendChange(changeForm(shown, { groupId, mentorId }));
    });
  }

  return (
    <>
      <select
        className={`${shared.input} ${styles.fit}`}
        value={picked}
        onChange={choose}
        disabled={isSaving}
        aria-label={`Pengasuh ${groupCode}`}
      >
        <option value="">Pilih pengasuh…</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <FormMessage state={state} />
    </>
  );
}
