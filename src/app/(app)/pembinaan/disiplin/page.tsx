import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { PenaltiesScreen } from "@/features/guidance/penalties-screen";
import { readPenaltiesParams } from "@/features/guidance/penalty-address";
import { readPenaltyBoard } from "@/features/guidance/penalty-board";

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
  const params = readPenaltiesParams(await props.searchParams);
  const board = await readPenaltyBoard(
    database(),
    opened.account,
    params,
    campusDay(),
  );
  if (board === null) forbidden();
  return (
    <PenaltiesScreen
      tabs={{ pagePath: "pembinaan", tabs: opened.tabs, open: "disiplin" }}
      board={board}
      params={params}
      form={null}
    />
  );
}
