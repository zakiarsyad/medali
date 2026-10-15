"use client";

import shared from "@/ui/data-screen.module.css";
import type { FormState } from "@/ui/form-message";
import {
  byWords,
  CleaningResultBadge,
  RepeatBadge,
} from "./cleaning-duty-parts";
import { CleaningValidateButtons } from "./cleaning-validate-buttons";
import { TaskItems } from "./task-cards";
import { useTaskAnswer } from "./task-decide";
import type { CleaningTask } from "./tasks-card";

function CleaningTaskRow({
  task,
  onSettled,
}: {
  task: CleaningTask;
  onSettled: (said: FormState) => void;
}) {
  const answered = useTaskAnswer(onSettled);
  return (
    <tr>
      <td data-title="Tanggal">{task.day}</td>
      <td className={shared.rowHeading} data-title="Tempat">
        <b>{task.place}</b> {task.isRepeat && <RepeatBadge />}
      </td>
      <td data-title="Kamar">{task.room}</td>
      <td data-title="Penilaian BAM">
        <CleaningResultBadge result={task.result} />
        {task.judgeNote !== "" && (
          <small className={shared.detail}>{task.judgeNote}</small>
        )}
        <small className={shared.detail}>
          Dinilai {byWords(task.judgedByName, task.judgedAt)}
        </small>
      </td>
      <td className={shared.rowActions}>
        <CleaningValidateButtons
          dutyId={task.id}
          rejectLabel="Tolak"
          onAnswer={answered}
        />
      </td>
    </tr>
  );
}

/**
 * The cleaning duties BAM assessed, each with Tanggal, Tempat, Kamar and
 * Penilaian BAM, "Validasi" and "Tolak": the same decisions as on
 * Pembersihan asrama.
 */
export function CleaningTasks({ tasks }: { tasks: CleaningTask[] }) {
  return (
    <TaskItems isEmpty={tasks.length === 0}>
      {(onSettled) => (
        <div className={shared.tableWrap}>
          <table className={`${shared.table} ${shared.stacked}`}>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Tempat</th>
                <th>Kamar</th>
                <th>Penilaian BAM</th>
                <th>
                  <span className={shared.hidden}>Tindakan</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <CleaningTaskRow
                  key={task.id}
                  task={task}
                  onSettled={onSettled}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </TaskItems>
  );
}
