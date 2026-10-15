import type { ReactNode } from "react";
import styles from "./leave.module.css";
import { ReportBadge, TimelinessBadge } from "./leave-badges";
import {
  type CheckWords,
  NO_RETURN_PHOTO_HERE,
  type ReportCard,
  returnPhotoAddress,
} from "./return-card";

/** The photo of a report, which opens whole in a new tab, or why there is none. */
export function ReturnPhoto({
  report,
}: {
  report: Pick<ReportCard, "id" | "hasPhoto">;
}) {
  if (!report.hasPhoto) {
    return <p className={styles.noReportPhoto}>{NO_RETURN_PHOTO_HERE}</p>;
  }
  const address = returnPhotoAddress(report.id);
  return (
    <a href={address} target="_blank" rel="noopener">
      {/* biome-ignore lint/performance/noImgElement: the picture is private and is given only after the server has checked who asks, which the image optimiser of the server cannot pass. */}
      <img
        src={address}
        alt="Foto lapor kembali"
        className={styles.reportPhoto}
        loading="lazy"
      />
    </a>
  );
}

/** One check as the card says it, such as BAM: Ditolak · Foto buram (Bima). */
function checkWords(who: string, check: CheckWords): string {
  const note = check.note === "" ? "" : ` · ${check.note}`;
  return `${who}: ${check.result}${note} (${check.by})`;
}

/**
 * The latest report of a return on a card: its photo, which opens whole
 * in a new tab, when it was sent with where it stands and how late, and
 * both checks with who made them. `children` holds what the card offers
 * to do with it.
 */
export function ReturnReportView({
  report,
  children,
}: {
  report: ReportCard;
  children?: ReactNode;
}) {
  return (
    <div className={styles.report}>
      <ReturnPhoto report={report} />
      <div className={styles.reportBody}>
        <b>Lapor kembali {report.sentAt}</b>
        <div className={styles.badges}>
          <ReportBadge status={report.status} />
          <TimelinessBadge timeliness={report.timeliness} />
        </div>
        {report.verification && (
          <p className={styles.quietLine}>
            {checkWords("BAM", report.verification)}
          </p>
        )}
        {report.validation && (
          <p className={styles.quietLine}>
            {checkWords("Pengelola", report.validation)}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
