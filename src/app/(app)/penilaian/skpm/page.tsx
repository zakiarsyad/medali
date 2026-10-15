import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readSkpmParams } from "@/features/skpm/skpm-address";
import {
  readSkpmDetail,
  readSkpmList,
  readSkpmNumbers,
} from "@/features/skpm/skpm-board";
import { readConversion } from "@/features/skpm/skpm-conversion";
import { SkpmDetailDialog } from "@/features/skpm/skpm-detail-dialog";
import { ReadOnlyNote } from "@/features/skpm/skpm-read-only";
import { skpmVisibleTo } from "@/features/skpm/skpm-readers";
import { SkpmScreen } from "@/features/skpm/skpm-screen";

/**
 * The tab Data SKPM. Each role sees the students its roles that open the
 * tab see: Ketua Program Studi those of their own program only, Pengasuh
 * their own mentees only. Kepala Unit and Penilai Mahasiswa may also
 * upload, remove an upload and set the conversion; the others see who
 * does. "Rincian" opens over the tab only for a student the account sees.
 */
export default async function SkpmPage(props: PageProps<"/penilaian/skpm">) {
  const opened = await openPage("penilaian", "skpm");
  const { account } = opened;
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "skpm" };
  const params = readSkpmParams(await props.searchParams);
  const db = database();
  const visible = skpmVisibleTo(account);
  const conversion = await readConversion(db);
  const { pointsForHundred } = conversion;
  const [numbers, list, detail] = await Promise.all([
    readSkpmNumbers(db, visible, pointsForHundred),
    readSkpmList(db, visible, pointsForHundred, params),
    params.detailId === null
      ? null
      : readSkpmDetail(db, visible, pointsForHundred, params.detailId),
  ]);
  const mayUpload = may(account.roles, "upload_skpm");
  return (
    <>
      <SkpmScreen
        tabs={tabs}
        params={params}
        pointsForHundred={pointsForHundred}
        numbers={numbers}
        list={list}
        manage={
          mayUpload ? null : (
            <ReadOnlyNote pointsForHundred={pointsForHundred} />
          )
        }
      />
      {detail && <SkpmDetailDialog detail={detail} params={params} />}
    </>
  );
}
