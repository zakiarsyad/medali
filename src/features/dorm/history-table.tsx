"use client";

import { useReducer } from "react";
import type { ClarifiedEntry } from "./clarification-time";
import { historyAfter, NO_ROW_OPEN } from "./history-state";
import { HistoryTableView } from "./history-table-view";

/**
 * Riwayat of a resident. It holds which row has its form open, one at a
 * time, and what the server last answered; how the rows are drawn is
 * apart from it.
 */
export function HistoryTable({ history }: { history: ClarifiedEntry[] }) {
  const [state, tell] = useReducer(historyAfter, NO_ROW_OPEN);
  return (
    <HistoryTableView
      history={history}
      state={state}
      onOpen={(key) => tell({ kind: "opened", key })}
      onCancel={() => tell({ kind: "cancelled" })}
      onAnswer={(key, answer) => tell({ kind: "answered", key, state: answer })}
    />
  );
}
