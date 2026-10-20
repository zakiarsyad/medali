import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { PenaltiesScreen } from "@/features/guidance/penalties-screen";
import { readPenaltiesParams } from "@/features/guidance/penalty-address";
import { readPenaltyBoard } from "@/features/guidance/penalty-board";
import { PenaltyForm } from "@/features/guidance/penalty-form";

/**
 * The tab Pelanggaran disiplin. Pembina Disiplin Mahasiswa and Kepala
 * Unit record penalties; Direktur, Ketua Program Studi and Pengasuh read
 * them, Ketua Program Studi their own program only and Pengasuh their
 * own mentees only. No other role opens the tab.
 */
export default async function DisciplinePenaltiesPage(
  props: PageProps<"/pembinaan/disiplin">,
) {
  const opened = await openPage("pembinaan", "disiplin");
  const { account } = opened;
  const params = readPenaltiesParams(await props.searchParams);
  const today = campusDay();
  const board = await readPenaltyBoard(database(), account, params, today);
  if (board === null) forbidden();
  const form = may(account.roles, "record_discipline_penalties") ? (
    <PenaltyForm newKey={crypto.randomUUID()} today={today} />
  ) : null;
  return (
    <PenaltiesScreen
      tabs={{ pagePath: "pembinaan", tabs: opened.tabs, open: "disiplin" }}
      board={board}
      params={params}
      form={form}
    />
  );
}
