import { forbidden } from "next/navigation";
import type { ReactNode } from "react";
import { campusDay } from "@/academic-periods/campus-day";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { PenaltyAssignmentPart } from "@/features/counselling/penalty-assignment-part";
import {
  type PenaltyAssignment,
  readPenaltyAssignments,
} from "@/features/counselling/penalty-assignments";
import { PenaltiesScreen } from "@/features/guidance/penalties-screen";
import {
  pickedStudentOf,
  readPenaltiesParams,
} from "@/features/guidance/penalty-address";
import {
  type PenaltyRow,
  readPenaltyBoard,
} from "@/features/guidance/penalty-board";
import { PenaltyForm } from "@/features/guidance/penalty-form";
import { readPenaltyStart } from "@/features/guidance/penalty-student";
import type { PenaltyCounselling } from "@/features/guidance/penalty-table";

/**
 * The tab Pelanggaran disiplin. Pembina Disiplin Mahasiswa and Kepala
 * Unit record penalties and follow them up; Direktur, Ketua Program
 * Studi and Pengasuh read them, Ketua Program Studi their own program
 * only and Pengasuh their own mentees only. No other role opens the tab.
 * Only Pembina Disiplin Mahasiswa sends a student to mandatory
 * counselling from "Rincian", with the Penugasan read for it alone.
 */
export default async function DisciplinePenaltiesPage(
  props: PageProps<"/pembinaan/disiplin">,
) {
  const opened = await openPage("pembinaan", "disiplin");
  const { account } = opened;
  const search = await props.searchParams;
  const params = readPenaltiesParams(search);
  const today = campusDay();
  const board = await readPenaltyBoard(database(), account, params);
  if (board === null) forbidden();
  const form = may(account.roles, "record_discipline_penalties") ? (
    <PenaltyForm
      newKey={crypto.randomUUID()}
      today={today}
      periods={await readAcademicPeriods(database())}
      start={
        await readPenaltyStart(database(), account, pickedStudentOf(search))
      }
    />
  ) : null;
  const assignments = await readPenaltyAssignments(
    database(),
    account,
    board.list.rows.map((row) => row.id),
  );
  return (
    <PenaltiesScreen
      tabs={{ pagePath: "pembinaan", tabs: opened.tabs, open: "disiplin" }}
      board={board}
      params={params}
      form={form}
      mayFollowUp={may(account.roles, "follow_up_discipline_penalties")}
      counselling={counsellingOf(board.list.rows, assignments)}
    />
  );
}

/**
 * Mandatory counselling in "Rincian" of each penalty, or nothing for an
 * account not given the Penugasan sent from penalties.
 */
function counsellingOf(
  rows: readonly PenaltyRow[],
  assignments: Map<string, PenaltyAssignment> | null,
): PenaltyCounselling {
  if (assignments === null) return {};
  const parts: Record<string, ReactNode> = {};
  for (const row of rows) {
    if (assignments.has(row.id)) continue;
    parts[row.id] = (
      <PenaltyAssignmentPart penaltyId={row.id} name={row.name} box={null} />
    );
  }
  return parts;
}
