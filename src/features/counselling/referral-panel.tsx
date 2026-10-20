import { roomWords } from "@/health-notes/health-words";
import shared from "@/ui/data-screen.module.css";
import { DAY } from "@/ui/day";
import { ListPager } from "@/ui/list-pager";
import styles from "./counselling.module.css";
import { REFERRALS_PAGE_SIZE, referralAddress } from "./referral-address";
import type { ReferralList, ReferralRow } from "./referral-view";

export const REFERRAL_NOTE =
  "Penanda awal dari BAM - Kesehatan berdasarkan pengamatan, bukan hasil asesmen.";

export const NO_REFERRALS = "Tidak ada rujukan dari asrama.";

function ReferralTableRow({ row }: { row: ReferralRow }) {
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
    </tr>
  );
}

/** The referred residents; on a phone each one is a card. */
function ReferralTable({ rows }: { rows: ReferralRow[] }) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Kamar</th>
            <th>Pengamatan</th>
            <th>Ditandai</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ReferralTableRow key={row.studentId} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * "Rujukan potensi kesehatan mental dari asrama" of Konselor: how many
 * residents the dorm marked "perlu dirujuk ke konselor", and one page of
 * them, the newest mark first.
 */
export function ReferralPanel({ list }: { list: ReferralList }) {
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
          <ReferralTable rows={list.rows} />
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
