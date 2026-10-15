import { Fragment } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./activities.module.css";
import { CLARIFICATION_LOOKS, HISTORY_LOOKS } from "./badge-look";
import type { CardsState } from "./cards-state";
import { fileAddressOf } from "./clarification-card";
import { ClarificationForm } from "./clarification-form";
import {
  CLARIFICATION_ACTION_WORDS,
  CLARIFICATION_BADGE_WORDS,
  type ClarificationCell,
  takesClarification,
} from "./clarification-time";
import type { HistoryRow } from "./history-row";
import { HISTORY_WORDS } from "./history-status";
import { LookBadge } from "./look-badge";

const TITLES = ["Tanggal", "Kegiatan", "Status", "Keterangan", "Klarifikasi"];

/**
 * What the Klarifikasi cell of a row shows: the newest clarification
 * with the file the student sent, which a press downloads, and the note
 * of a rejection, and the way to ask, or that the time to ask is over. A row with nothing to say keeps the cell empty, so it
 * takes no room on a phone.
 */
function ClarificationCellView({
  cell,
  onOpen,
}: {
  cell: ClarificationCell;
  onOpen: () => void;
}) {
  const { badge, note, file, removed, action } = cell;
  return (
    <>
      {badge !== null && (
        <LookBadge
          words={CLARIFICATION_BADGE_WORDS[badge]}
          look={CLARIFICATION_LOOKS[badge]}
        />
      )}
      {file !== null && (
        <a
          href={fileAddressOf(file.clarificationId, false)}
          className={`${shared.link} ${styles.sentFile}`}
        >
          Lampiran: {file.name}
        </a>
      )}
      {removed !== null && <span className={shared.detail}>{removed}</span>}
      {note !== "" && <span className={shared.detail}>{note}</span>}
      {action === "closed" && (
        <span className={shared.detail}>
          {CLARIFICATION_ACTION_WORDS.closed}
        </span>
      )}
      {(action === "ask" || action === "ask_again") && (
        <button type="button" className={shared.link} onClick={onOpen}>
          {CLARIFICATION_ACTION_WORDS[action]}
        </button>
      )}
    </>
  );
}

function RowCells({ row, onOpen }: { row: HistoryRow; onOpen: () => void }) {
  return (
    <>
      <td data-title="Tanggal">{row.days}</td>
      <td data-title="Kegiatan">
        {row.name}
        {!row.isRequired && (
          <span className={shared.detail}>(tidak wajib)</span>
        )}
      </td>
      <td data-title="Status">
        <LookBadge
          words={HISTORY_WORDS[row.status]}
          look={HISTORY_LOOKS[row.status]}
        />
        {row.uploadUntil !== null && (
          <span className={shared.detail}>sampai {row.uploadUntil}</span>
        )}
      </td>
      <td data-title="Keterangan">{row.note}</td>
      <td data-title="Klarifikasi">
        <ClarificationCellView cell={row.clarification} onOpen={onOpen} />
      </td>
    </>
  );
}

/**
 * The table of "Riwayat kehadiran" as it is drawn for one state: a row
 * for each schedule, under it the form of a clarification when that row
 * has it open and may still be asked for, and under that the last answer
 * to its form. A table, and cards on a phone.
 */
export function HistoryTableView({
  rows,
  state,
  onOpen,
  onCancel,
  onAnswer,
}: {
  rows: HistoryRow[];
  state: CardsState;
  onOpen: (rowId: string) => void;
  onCancel: () => void;
  onAnswer: (rowId: string, answer: FormState) => void;
}) {
  const { openId, answer } = state;
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
                <RowCells row={row} onOpen={() => onOpen(row.id)} />
              </tr>
              {openId === row.id && takesClarification(row.clarification) && (
                <tr>
                  <td colSpan={TITLES.length}>
                    <ClarificationForm
                      scheduleId={row.id}
                      onAnswer={(sent) => onAnswer(row.id, sent)}
                      onCancel={onCancel}
                    />
                  </td>
                </tr>
              )}
              {answer?.cardId === row.id && (
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
