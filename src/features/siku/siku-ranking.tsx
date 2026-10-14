import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import styles from "./siku.module.css";
import { type SikuParams, sikuAddress } from "./siku-address";
import type { SikuRanking, SikuRow } from "./siku-board";
import { signedChange, signedPoints } from "./siku-words";

function RankTable({
  rows,
  isFall,
}: {
  rows: readonly SikuRow[];
  isFall: boolean;
}) {
  if (rows.length === 0) return <p className={shared.empty}>Tidak ada.</p>;
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>No</th>
            <th>Mahasiswa</th>
            <th>Tambah</th>
            <th>Kurang</th>
            <th>Perubahan</th>
            <th>SIKU</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, place) => (
            <tr key={row.id}>
              <td className={shared.detail} data-title="No">
                {place + 1}
              </td>
              <td data-title="Mahasiswa">
                <b className={shared.typed}>{row.name}</b>
                <small className={shared.detail}>
                  {row.nim} · {row.program}
                </small>
              </td>
              <td data-title="Tambah">{signedPoints(row.gains, "gain")}</td>
              <td data-title="Kurang">{signedPoints(row.losses, "loss")}</td>
              <td
                className={`${styles.strong} ${isFall ? styles.loss : styles.gain}`}
                data-title="Perubahan"
              >
                {signedChange(row.gains - row.losses)}
              </td>
              <td data-title="SIKU">{row.siku}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankPanel({
  title,
  rows,
  total,
  isFall,
  allAddress,
}: {
  title: string;
  rows: readonly SikuRow[];
  total: number;
  isFall: boolean;
  /** The address that shows every one, or null when every one shows. */
  allAddress: string | null;
}) {
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <h3 className={shared.heading}>{title}</h3>
        <span className={shared.detail}>
          {total.toLocaleString("id-ID")} mahasiswa
        </span>
      </div>
      <RankTable rows={rows} isFall={isFall} />
      {allAddress !== null && rows.length < total && (
        <p className={styles.more}>
          <Link href={allAddress} className={shared.link} scroll={false}>
            Tampilkan semua ({total.toLocaleString("id-ID")})
          </Link>
        </p>
      )}
    </section>
  );
}

/**
 * "Perubahan nilai SIKU per mahasiswa": the largest falls and the largest
 * rises from Nilai dasar, side by side, each with "Tampilkan semua".
 */
export function SikuRankingPanels({
  ranking,
  params,
  base,
}: {
  ranking: SikuRanking;
  params: SikuParams;
  base: number;
}) {
  return (
    <section>
      <h2 className={`${shared.heading} ${styles.spaced}`}>
        Perubahan nilai SIKU per mahasiswa
      </h2>
      <p className={styles.sub}>
        Diurutkan dari penurunan dan kenaikan paling besar, dihitung dari nilai
        dasar {base}.
      </p>
      <div className={styles.sideBySide}>
        <RankPanel
          title="Penurunan SIKU terbesar"
          rows={ranking.falls}
          total={ranking.fallCount}
          isFall
          allAddress={
            params.allFalls ? null : sikuAddress({ ...params, allFalls: true })
          }
        />
        <RankPanel
          title="Kenaikan SIKU terbesar"
          rows={ranking.rises}
          total={ranking.riseCount}
          isFall={false}
          allAddress={
            params.allRises ? null : sikuAddress({ ...params, allRises: true })
          }
        />
      </div>
    </section>
  );
}
