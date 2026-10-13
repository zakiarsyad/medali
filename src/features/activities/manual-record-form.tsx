"use client";

import { unstable_rethrow } from "next/navigation";
import { useReducer, useState, useTransition } from "react";
import { useFound } from "@/ui/use-found";
import { answerOr } from "./card-decisions";
import {
  RECORD_NOT_SENT,
  type RecordAnswer,
  type RecordStudent,
} from "./manual-record";
import { ManualRecordView } from "./manual-record-view";
import { EMPTY_RECORD_FORM, recordFormAfter } from "./record-form-state";
import { RecordStudentField } from "./record-student-field";
import {
  readRecordActivitiesAction,
  recordAttendanceAction,
  searchRecordStudentsAction,
} from "./verification-actions";

const NOT_SENT: RecordAnswer = {
  state: { error: RECORD_NOT_SENT, done: null },
  confirm: null,
};

/**
 * "Catat kehadiran manual atau dispensasi". It holds what is typed in
 * the search, what the form keeps, and whether something is on its way;
 * what follows from each press and answer is decided apart from it, and
 * so is how the form is drawn.
 */
export function ManualRecordForm() {
  const [query, setQuery] = useState("");
  const [form, tell] = useReducer(recordFormAfter, EMPTY_RECORD_FORM);
  const [busy, startWorking] = useTransition();
  const found = useFound(query, searchRecordStudentsAction);

  async function list(studentId: string) {
    const activities = await answerOr(
      () => readRecordActivitiesAction(studentId),
      unstable_rethrow,
      [],
    );
    tell({ kind: "listed", studentId, activities });
  }

  function pick(student: RecordStudent | null) {
    setQuery("");
    tell({ kind: "picked", student });
    if (student !== null) startWorking(() => list(student.id));
  }

  /** The list is read again after a save: it shows the status just recorded. */
  function save() {
    startWorking(async () => {
      const sent = {
        studentId: form.student?.id ?? "",
        scheduleId: form.scheduleId,
        kind: form.kind,
        note: form.note,
        replaces: form.agreed,
      };
      const answer = await answerOr(
        () => recordAttendanceAction(sent),
        unstable_rethrow,
        NOT_SENT,
      );
      tell({ kind: "answered", answer });
      const wasSaved = answer.state.done !== null;
      if (wasSaved && form.student !== null) await list(form.student.id);
    });
  }

  return (
    <ManualRecordView
      form={form}
      busy={busy}
      student={
        <RecordStudentField
          student={form.student}
          query={query}
          found={found}
          busy={busy}
          onQuery={setQuery}
          onPick={pick}
        />
      }
      onChoose={(scheduleId) => tell({ kind: "chose", scheduleId })}
      onKind={(value) => tell({ kind: "set-kind", value })}
      onNote={(note) => tell({ kind: "typed", note })}
      onSave={save}
    />
  );
}
