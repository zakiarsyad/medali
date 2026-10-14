"use client";

import { useReducer } from "react";
import { cardsAfter, NO_CARD_OPEN } from "./cards-state";
import type { HistoryRow } from "./history-row";
import { HistoryTableView } from "./history-table-view";

/**
 * The table of "Riwayat kehadiran". It holds which row has its form
 * open, one at a time, and what the server last answered, by the rule
 * the running cards keep their upload by; how the rows are drawn is
 * apart from it.
 */
export function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  const [state, tell] = useReducer(cardsAfter, NO_CARD_OPEN);
  return (
    <HistoryTableView
      rows={rows}
      state={state}
      onOpen={(cardId) => tell({ kind: "opened", cardId })}
      onCancel={() => tell({ kind: "cancelled" })}
      onAnswer={(cardId, answer) =>
        tell({ kind: "answered", cardId, state: answer })
      }
    />
  );
}
