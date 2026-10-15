"use client";

import { Fragment, useReducer } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { historyAfter, NO_ROW_OPEN } from "./history-state";
import { ReduceOneForm } from "./reduce-one-form";
import type { AnnouncedViolation } from "./violation-announcement";
import { ONE_STUDENT_TITLES, ViolationCells } from "./violation-lists";
import { recordStatus } from "./violation-status";

const TITLES = [...ONE_STUDENT_TITLES, "Pengurangan"];

/** Whether a violation went up to Pengelola Asrama and is not reduced, at `now`. */
export function isReducible(row: AnnouncedViolation, now: Date): boolean {
  const status = recordStatus(row.announcedAt, row.appeal, row.reduced, now);
  return status === "escalated";
}

/**
 * The violations of one student for Pengelola Asrama, each at Naik ke
 * Pengelola with "Kurangi". Under a row its form, when open, and the
 * last answer to it, which stays as the row turns Dikurangi. One form is
 * open at a time. A table, and cards on a phone.
 */
export function ReducibleTable({
  rows,
  studentId,
  name,
  now,
}: {
  rows: AnnouncedViolation[];
  studentId: string;
  name: string;
  now: Date;
}) {
  const [state, tell] = useReducer(historyAfter, NO_ROW_OPEN);
  const { openKey, answer } = state;
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            {TITLES.map((title) => (
              <th key={title}>{title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const reducible = isReducible(row, now);
            return (
              <Fragment key={row.id}>
                <tr>
                  <ViolationCells
                    row={row}
                    now={now}
                    reader="staff"
                    withStudent={false}
                  />
                  <td data-title="Pengurangan">
                    {reducible ? (
                      <button
                        type="button"
                        className={shared.quiet}
                        onClick={() => tell({ kind: "opened", key: row.id })}
                      >
                        Kurangi
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
                {openKey === row.id && reducible && (
                  <tr>
                    <td colSpan={TITLES.length}>
                      <ReduceOneForm
                        studentId={studentId}
                        name={name}
                        violationId={row.id}
                        day={row.day}
                        onAnswer={(sent) =>
                          tell({ kind: "answered", key: row.id, state: sent })
                        }
                        onCancel={() => tell({ kind: "cancelled" })}
                      />
                    </td>
                  </tr>
                )}
                {answer?.key === row.id && (
                  <tr>
                    <td colSpan={TITLES.length}>
                      <FormMessage state={answer.state} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
