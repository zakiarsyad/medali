import Link from "next/link";
import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import type { RequestBoard } from "./request-board";
import styles from "./siku.module.css";
import {
  REQUEST_FILTER_WORDS,
  REQUEST_FILTERS,
  REQUEST_PAGE_SIZE,
  type SikuParams,
  sikuAddress,
} from "./siku-address";

export const READ_ONLY_REQUESTS = "Pengajuan diperiksa oleh Penilai Mahasiswa.";

export const DECIDER_REQUESTS =
  "Periksa laporan, lalu setujui dengan memberi poin atau tolak dengan alasan.";

export const NO_REQUESTS_HERE = "Tidak ada pengajuan pada status ini.";

function StatusChoice({
  board,
  params,
}: {
  board: RequestBoard;
  params: SikuParams;
}) {
  return (
    <nav className={styles.choices} aria-label="Status pengajuan">
      {REQUEST_FILTERS.map((filter) => (
        <Link
          key={filter}
          href={sikuAddress({
            ...params,
            requestFilter: filter,
            requestPage: 1,
          })}
          className={styles.choice}
          aria-current={filter === params.requestFilter ? "true" : undefined}
          scroll={false}
        >
          {REQUEST_FILTER_WORDS[filter]}{" "}
          {board.counts[filter].toLocaleString("id-ID")}
        </Link>
      ))}
    </nav>
  );
}

/**
 * "Pengajuan penambahan SIKU dari mahasiswa": the status choice, which
 * the address holds, with how many requests each holds, the cards of the
 * chosen one and the pages. Those who decide are told what to do, and
 * those who only read who decides. `cards` draws the cards of the page.
 */
export function RequestPanel({
  board,
  params,
  mayDecide,
  cards,
}: {
  board: RequestBoard;
  params: SikuParams;
  mayDecide: boolean;
  cards: ReactNode;
}) {
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={shared.heading}>
            Pengajuan penambahan SIKU dari mahasiswa
          </h2>
          <p className={styles.sub}>
            Mahasiswa melaporkan kegiatan dengan foto bukti, tanggal, dan
            keterangan. {mayDecide ? DECIDER_REQUESTS : READ_ONLY_REQUESTS}
          </p>
        </div>
        <StatusChoice board={board} params={params} />
      </div>
      {board.cards.length === 0 ? (
        <p className={shared.empty}>{NO_REQUESTS_HERE}</p>
      ) : (
        cards
      )}
      {board.matching > 0 && (
        <ListPager
          page={board.page}
          matching={board.matching}
          pageSize={REQUEST_PAGE_SIZE}
          noun="pengajuan"
          keepsPlace
          stepsOnOnePage={false}
          addressOf={(page) => sikuAddress({ ...params, requestPage: page })}
        />
      )}
    </section>
  );
}
