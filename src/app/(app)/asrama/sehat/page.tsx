import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readDormHealthList } from "@/features/dorm/dorm-health";
import { readDormHealthParams } from "@/features/dorm/dorm-health-address";
import { DormHealthNoteForm } from "@/features/dorm/dorm-health-note-panel";
import { DormHealthScreen } from "@/features/dorm/dorm-health-screen";
import { mayWriteDormNotes } from "@/features/dorm/dorm-health-subject";
import { LIST_READER_NOTE } from "@/features/dorm/dorm-health-words";
import { readFitnessLimits } from "@/health-notes/fitness-limits";

/**
 * The tab Kesehatan. An account that may read the list sees the numbers
 * and "Mahasiswa asrama yang sakit" of the Aktif residents that right
 * lets it see. Kepala Unit and BAM - Kesehatan write residents' notes;
 * any other account opening the tab is told who fills them.
 */
export default async function DormHealthPage(
  props: PageProps<"/asrama/sehat">,
) {
  const opened = await openPage("asrama", "sehat");
  const { account } = opened;
  const readsList = may(account.roles, "view_dorm_health_notes");
  const counts = may(account.roles, "view_dorm_health_numbers");
  if (!readsList && !counts) forbidden();
  const tabs = { pagePath: "asrama", tabs: opened.tabs, open: "sehat" };
  const params = readDormHealthParams(await props.searchParams);
  const db = database();
  const { limits } = await readFitnessLimits(db);
  const today = campusDay();
  const found = await readDormHealthList(db, account, params, limits, today);
  const form = mayWriteDormNotes(account.roles) ? (
    <DormHealthNoteForm today={today} newKey={crypto.randomUUID()} />
  ) : null;
  return (
    <DormHealthScreen
      tabs={tabs}
      found={found}
      params={params}
      form={form}
      readOnlyNote={LIST_READER_NOTE}
    />
  );
}
