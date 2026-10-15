"use client";

import { Fragment, useReducer } from "react";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { FormMessage } from "@/ui/form-message";
import { AppealForm } from "./appeal-form";
import type { AppealStatus } from "./appeal-ids";
import { appealStanding } from "./appeal-rules";
import { APPEAL_BADGE_WORDS, shortReason } from "./appeal-words";
import { historyAfter, NO_ROW_OPEN } from "./history-state";
import type { OwnAppeal, OwnViolation } from "./own-violations";
import { appealProofAddress } from "./violation-address";
import { StatusBadge } from "./violation-lists";
import { appealEndOf } from "./violation-status";
import { punishmentText, shownHour } from "./violation-words";
import styles from "./violations.module.css";

const TITLES = [
  "Tanggal",
  "Alasan pelanggaran",
  "Hukuman",
  "Diumumkan",
  "Status",
  "Advokasi",
];

const APPEAL_LOOKS: Record<AppealStatus, string | undefined> = {
  waiting: styles.warn,
  accepted: styles.ok,
  rejected: styles.bad,
};

/** The appeal as its resident sees it: its status, its reason, the note of BAM and the proof. */
function AppealCell({ appeal }: { appeal: OwnAppeal }) {
  return (
    <>
      <span className={`${shared.badge} ${APPEAL_LOOKS[appeal.status]}`}>
        {APPEAL_BADGE_WORDS[appeal.status]}
      </span>
      <small className={`${shared.detail} ${shared.typed}`}>
        {shortReason(appeal.reason)}
      </small>
      {appeal.note !== "" && (
        <small className={`${shared.detail} ${shared.typed}`}>
          BAM: {appeal.note}
        </small>
      )}
      {appeal.proofName !== null && (
        <a
          href={appealProofAddress(appeal.id)}
          className={`${shared.link} ${shared.typed}`}
        >
          Lihat bukti: {appeal.proofName}
        </a>
      )}
    </>
  );
}

function RowCells({
  row,
  now,
  onOpen,
}: {
  row: OwnViolation;
  now: Date;
  onOpen: () => void;
}) {
  const standing = appealStanding(row.announcedAt, row.ownAppeal !== null, now);
  return (
    <>
      <td data-title="Tanggal">{shownDay(row.day)}</td>
      <td data-title="Alasan pelanggaran">
        <span className={shared.typed}>{row.reason}</span>
      </td>
      <td data-title="Hukuman">
        <span className={shared.typed}>
          {punishmentText(row.punishment, row.otherPunishment)}
        </span>
      </td>
      <td data-title="Diumumkan">{shownHour(row.announcedAt)}</td>
      <td data-title="Status">
        <StatusBadge
          announcedAt={row.announcedAt}
          appeal={row.appeal}
          now={now}
        />
      </td>
      <td data-title="Advokasi">
        {row.ownAppeal !== null && <AppealCell appeal={row.ownAppeal} />}
        {standing === "open" && (
          <button type="button" className={shared.quiet} onClick={onOpen}>
            Ajukan advokasi
          </button>
        )}
        {row.ownAppeal === null && standing !== "open" && "-"}
      </td>
    </>
  );
}

/**
 * "Rekam jejak pelanggaran saya": the resident's own announced
 * violations, each with its appeal, or "Ajukan advokasi" while its
 * appeal time lasts. Under a row its form, when open, and the last
 * answer to it. One form is open at a time. A table, and cards on a
 * phone.
 */
export function OwnViolationTable({
  rows,
  now,
}: {
  rows: OwnViolation[];
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
          {rows.map((row) => (
            <Fragment key={row.id}>
              <tr>
                <RowCells
                  row={row}
                  now={now}
                  onOpen={() => tell({ kind: "opened", key: row.id })}
                />
              </tr>
              {openKey === row.id && row.ownAppeal === null && (
                <tr>
                  <td colSpan={TITLES.length}>
                    <AppealForm
                      violationId={row.id}
                      deadline={shownHour(appealEndOf(row.announcedAt))}
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
