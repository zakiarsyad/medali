import { roomWords } from "@/health-notes/health-words";
import shared from "@/ui/data-screen.module.css";
import { DAY } from "@/ui/day";
import { ListPager } from "@/ui/list-pager";
import { ConsentBadge } from "./consent-badge";
import styles from "./counselling.module.css";
import { REFERRALS_PAGE_SIZE, referralAddress } from "./referral-address";
import type { ReferralList, ReferralRow } from "./referral-view";
import { SCHEDULE_STATUS_WORDS } from "./schedule-words";

export const REFERRAL_NOTE =
  "Penanda awal dari BAM - Kesehatan berdasarkan pengamatan, bukan hasil asesmen.";

export const NO_REFERRALS = "Tidak ada rujukan dari asrama.";

/** "Jadwal aktif" of a student without an active request. */
export const NO_ACTIVE_SCHEDULE = "Tidak ada";

/** What "Tindak lanjuti" does, or null for an account that may not. */
type FollowUp = ((row: ReferralRow) => void) | null;

function ReferralTableRow({
  row,
  onFollowUp,
}: {
  row: ReferralRow;
  onFollowUp: FollowUp;
}) {
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Mahasiswa">
        <b className={shared.typed}>{row.name}</b>
        <small className={shared.detail}>
          {row.nim} · {row.program}
        </small>
      </td>
      <td data-title="Kamar">{roomWords(row.dorm, row.room)}</td>
      <td data-title="Pengamatan">
        <span className={shared.typed}>{row.observation}</span>
      </td>
      <td data-title="Ditandai">
        {DAY.format(row.markedAt)}
        <small className={shared.detail}>{row.markedBy}</small>
      </td>
      <td data-title="Persetujuan">
        <ConsentBadge status={row.consent} />
      </td>
      <td data-title="Jadwal aktif">
        {row.activeSchedule === null
          ? NO_ACTIVE_SCHEDULE
          : SCHEDULE_STATUS_WORDS[row.activeSchedule]}
      </td>
      <td className={shared.rowActions}>
        {onFollowUp && (
          <button
            type="button"
            className={shared.quiet}
            onClick={() => onFollowUp(row)}
          >
            Tindak lanjuti
          </button>
        )}
      </td>
    </tr>
  );
}

/** The referred residents; on a phone each one is a card. */
function ReferralTable({
  rows,
  onFollowUp,
}: {
  rows: ReferralRow[];
  onFollowUp: FollowUp;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Kamar</th>
            <th>Pengamatan</th>
            <th>Ditandai</th>
            <th>Persetujuan</th>
            <th>Jadwal aktif</th>
            <th>
              <span className={shared.hidden}>Tindak lanjuti</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ReferralTableRow
              key={row.studentId}
              row={row}
              onFollowUp={onFollowUp}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * "Rujukan potensi kesehatan mental dari asrama" of Konselor: how many
 * residents the dorm marked "perlu dirujuk ke konselor", and one page of
 * them, the newest mark first, each with what is already under way.
 * "Tindak lanjuti" picks the student on "Persetujuan konseling".
 */
export function ReferralPanel({
  list,
  onFollowUp = null,
}: {
  list: ReferralList;
  onFollowUp?: FollowUp;
}) {
  return (
    <section className={`${shared.panel} ${styles.stack}`}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>
          Rujukan potensi kesehatan mental dari asrama
        </h2>
        <span className={`${shared.badge} ${styles.plain}`}>
          {list.matching.toLocaleString("id-ID")}
        </span>
      </div>
      <p className={styles.sub}>{REFERRAL_NOTE}</p>
      {list.matching === 0 ? (
        <p className={shared.empty}>{NO_REFERRALS}</p>
      ) : (
        <>
          <ReferralTable rows={list.rows} onFollowUp={onFollowUp} />
          <ListPager
            page={list.page}
            matching={list.matching}
            pageSize={REFERRALS_PAGE_SIZE}
            noun="rujukan"
            keepsPlace
            stepsOnOnePage={false}
            addressOf={referralAddress}
          />
        </>
      )}
    </section>
  );
}
