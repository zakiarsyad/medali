import { Fragment } from "react";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./activities.module.css";
import { clarificationFileAddress } from "./clarification-address";
import { ClarificationForm } from "./clarification-form";
import type { DormClarificationStatus } from "./clarification-ids";
import {
  CLARIFICATION_ACTION_WORDS,
  CLARIFICATION_BADGE_WORDS,
  type ClarificationCell,
  type ClarifiedEntry,
  takesClarification,
} from "./clarification-time";
import { HISTORY_STATUS_WORDS, type HistoryStatus, heldKey } from "./history";
import type { HistoryState } from "./history-state";

const TITLES = ["Tanggal", "Kegiatan", "Status", "Catatan", "Klarifikasi"];

const STATUS_STYLES: Record<HistoryStatus, string | undefined> = {
  present: styles.ok,
  absent: styles.bad,
  leave: styles.plain,
  not_announced: styles.warn,
};

const CLARIFICATION_STYLES: Record<
  DormClarificationStatus,
  string | undefined
> = {
  submitted: styles.warn,
  verified: styles.warn,
  accepted: styles.ok,
  rejected: styles.bad,
  closed: styles.plain,
};

/**
 * What the Klarifikasi cell of a row shows: the newest clarification
 * with the file the resident sent, which a press downloads, and the note
 * of a rejection or a closing, and the way to ask, or that the time to
 * ask is over. A row with nothing to say keeps the cell empty, so it
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
        <span className={`${shared.badge} ${CLARIFICATION_STYLES[badge]}`}>
          {CLARIFICATION_BADGE_WORDS[badge]}
        </span>
      )}
      {file !== null && (
        <a
          href={clarificationFileAddress(file.clarificationId, false)}
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

function RowCells({
  entry,
  onOpen,
}: {
  entry: ClarifiedEntry;
  onOpen: () => void;
}) {
  return (
    <>
      <td data-title="Tanggal">
        {shownDay(entry.day)}{" "}
        <span className={shared.detail}>{entry.startTime}</span>
      </td>
      <td data-title="Kegiatan">{entry.name}</td>
      <td data-title="Status">
        <span className={`${shared.badge} ${STATUS_STYLES[entry.status]}`}>
          {HISTORY_STATUS_WORDS[entry.status]}
        </span>
      </td>
      <td data-title="Catatan">{entry.note || "-"}</td>
      <td data-title="Klarifikasi">
        <ClarificationCellView cell={entry.clarification} onOpen={onOpen} />
      </td>
    </>
  );
}

/**
 * Riwayat as it is drawn for one state: a row for each activity that is
 * over, under it the form of a clarification when that row has it open
 * and may still be asked, and under that the last answer to its form,
 * then who checks a clarification. A table, and cards on a phone.
 */
export function HistoryTableView({
  history,
  state,
  onOpen,
  onCancel,
  onAnswer,
}: {
  history: ClarifiedEntry[];
  state: HistoryState;
  onOpen: (key: string) => void;
  onCancel: () => void;
  onAnswer: (key: string, answer: FormState) => void;
}) {
  if (history.length === 0) {
    return <p className={shared.empty}>Belum ada riwayat.</p>;
  }
  const { openKey, answer } = state;
  return (
    <>
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
            {history.map((entry) => {
              const key = heldKey(entry);
              const isOpen =
                openKey === key && takesClarification(entry.clarification);
              return (
                <Fragment key={key}>
                  <tr>
                    <RowCells entry={entry} onOpen={() => onOpen(key)} />
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={TITLES.length}>
                        <ClarificationForm
                          activityId={entry.activityId}
                          day={entry.day}
                          onAnswer={(sent) => onAnswer(key, sent)}
                          onCancel={onCancel}
                        />
                      </td>
                    </tr>
                  )}
                  {answer?.key === key && (
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
      <p className={styles.quietLine}>
        Klarifikasi diverifikasi Badan Asrama Mahasiswa lalu divalidasi
        Pengelola Asrama.
      </p>
    </>
  );
}
