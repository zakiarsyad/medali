import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import {
  HISTORY_PAGE_SIZE,
  type SkpmParams,
  skpmAddress,
} from "./skpm-address";
import type { UploadHistory } from "./skpm-uploads";
import { UploadHistoryTable } from "./upload-history-table";

/** "Riwayat unggahan": every SKPM upload, the latest first, 20 a page. */
export function UploadHistoryPanel({
  history,
  params,
  mayRemove,
}: {
  history: UploadHistory;
  params: SkpmParams;
  mayRemove: boolean;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Riwayat unggahan</h2>
      <UploadHistoryTable lines={history.lines} mayRemove={mayRemove} />
      {history.matching > 0 && (
        <ListPager
          page={history.page}
          matching={history.matching}
          pageSize={HISTORY_PAGE_SIZE}
          noun="unggahan"
          keepsPlace
          addressOf={(page) =>
            skpmAddress({ ...params, historyPage: page, detailId: null })
          }
        />
      )}
    </section>
  );
}
