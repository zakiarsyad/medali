import { ConversionPanel } from "./conversion-panel";
import styles from "./skpm.module.css";
import type { SkpmParams } from "./skpm-address";
import type { SkpmConversion } from "./skpm-conversion";
import { ReadOnlyNote } from "./skpm-read-only";
import { SkpmUpload } from "./skpm-upload";
import type { UploadHistory } from "./skpm-uploads";
import { conversionNote } from "./skpm-words";
import { UploadHistoryPanel } from "./upload-history-panel";

/**
 * What sits between the numbers and the list: for those who may upload,
 * "Unggah data SKPM" beside "Konversi poin ke nilai"; for the others,
 * who uploads and how many points equal 100. Then "Riwayat unggahan".
 */
export function SkpmManage({
  mayUpload,
  conversion,
  history,
  params,
}: {
  mayUpload: boolean;
  conversion: SkpmConversion;
  history: UploadHistory;
  params: SkpmParams;
}) {
  const { pointsForHundred } = conversion;
  return (
    <>
      {mayUpload ? (
        <div className={styles.sideBySide}>
          <SkpmUpload />
          <ConversionPanel
            pointsForHundred={pointsForHundred}
            note={conversionNote(conversion.set)}
          />
        </div>
      ) : (
        <ReadOnlyNote pointsForHundred={pointsForHundred} />
      )}
      <UploadHistoryPanel
        history={history}
        params={params}
        mayRemove={mayUpload}
      />
    </>
  );
}
