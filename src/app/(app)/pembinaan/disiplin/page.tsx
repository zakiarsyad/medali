import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { PenaltiesScreen } from "@/features/guidance/penalties-screen";
import {
  pickedStudentOf,
  readPenaltiesParams,
} from "@/features/guidance/penalty-address";
import { readPenaltyBoard } from "@/features/guidance/penalty-board";
import { PenaltyForm } from "@/features/guidance/penalty-form";
import { readPenaltyStart } from "@/features/guidance/penalty-student";

/**
 * The tab Pelanggaran disiplin. Pembina Disiplin Mahasiswa and Kepala
 * Unit record penalties and follow them up; Direktur, Ketua Program
 * Studi and Pengasuh read them, Ketua Program Studi their own program
 * only and Pengasuh their own mentees only. No other role opens the tab.
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
  return (
    <PenaltiesScreen
      tabs={{ pagePath: "pembinaan", tabs: opened.tabs, open: "disiplin" }}
      board={board}
      params={params}
      form={form}
      mayFollowUp={may(account.roles, "follow_up_discipline_penalties")}
    />
  );
}
