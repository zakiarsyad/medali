import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { shownMoment } from "@/ui/day";
import board from "./dashboard.module.css";
import { Bars } from "./dashboard-bars";
import type { LeaveByKind, OutList, OutResident } from "./dashboard-leave";
import { countBar } from "./dashboard-words";
import { leaveListAddress } from "./leave-address";
import { LateBadge } from "./leave-badges";
import { LEAVE_KINDS } from "./leave-ids";
import { KIND_WORDS } from "./leave-words";

export const NO_MONTH_LEAVE = "Belum ada pengajuan izin bulan ini.";
export const NOBODY_OUT = "Tidak ada.";
export const ONLY_SEEN_NAMES =
  "Nama hanya ditampilkan untuk penghuni yang boleh Anda lihat.";

/** Perizinan asrama, narrowed to those out of the dorm now. */
const ALL_OUT_ADDRESS = leaveListAddress({
  status: "out",
  kind: "all",
  query: "",
});

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

function totalOf(byKind: LeaveByKind): number {
  let total = 0;
  for (const kind of LEAVE_KINDS) total += byKind[kind];
  return total;
}

function MonthLeave({ byKind }: { byKind: LeaveByKind }) {
  const total = totalOf(byKind);
  return (
    <>
      <div className={board.head}>
        <h2 className={shared.heading}>Perizinan bulan ini</h2>
        <span className={board.sub}>{shown(total)} pengajuan</span>
      </div>
      {total === 0 ? (
        <p className={shared.empty}>{NO_MONTH_LEAVE}</p>
      ) : (
        <Bars
          bars={LEAVE_KINDS.map((kind) => ({
            key: kind,
            label: KIND_WORDS[kind],
            ...countBar(byKind[kind], total),
          }))}
        />
      )}
    </>
  );
}

/** Tujuan and the room, without Tujuan when none was given. */
function placeWords(resident: OutResident): string {
  if (resident.destination === "") return resident.room;
  return `${resident.destination} · ${resident.room}`;
}

/*
 * An account with roles that see different residents, such as Ketua
 * Program Studi with a BAM role, counts every resident out but may be
 * named only some of them.
 */
function OutNames({ out, outCount }: { out: OutList; outCount: number }) {
  if (out.residents.length === 0) return <OutCount amount={outCount} />;
  const namesFewer = out.total < outCount;
  return (
    <>
      <ul className={board.outList}>
        {out.residents.map((resident) => (
          <li key={resident.leaveId} className={board.outItem}>
            <span className={board.when}>{shownMoment(resident.endsAt)}</span>
            <div className={board.outBody}>
              <b>{resident.name}</b>{" "}
              <span className={board.sub}>
                · {KIND_WORDS[resident.kind].toLowerCase()}
              </span>{" "}
              {resident.isLate && <LateBadge />}
              <span className={shared.detail}>{placeWords(resident)}</span>
            </div>
          </li>
        ))}
      </ul>
      {out.hasMore && (
        <p className={board.more}>
          <Link href={ALL_OUT_ADDRESS}>Lihat semua di Perizinan asrama</Link>
        </p>
      )}
      {namesFewer && <p className={board.more}>{ONLY_SEEN_NAMES}</p>}
    </>
  );
}

/** For an account without the right to the names: how many are out, and nothing more. */
function OutCount({ amount }: { amount: number }) {
  if (amount === 0) return <p className={shared.empty}>{NOBODY_OUT}</p>;
  return (
    <p className={board.outCount}>
      {shown(amount)} penghuni sedang di luar asrama.
    </p>
  );
}

/**
 * Perizinan bulan ini, with the requests of each kind, and Sedang di luar
 * asrama: each resident out now with the time due back, for an account
 * that may see their names; only how many for any other.
 */
export function LeavePanel({
  byKind,
  out,
  outCount,
}: {
  byKind: LeaveByKind;
  /** Null for an account without the right to the names. */
  out: OutList | null;
  /** How many are out, as "Sedang di luar asrama" counts them. */
  outCount: number;
}) {
  return (
    <section className={shared.panel}>
      <MonthLeave byKind={byKind} />
      <h3 className={board.subheading}>Sedang di luar asrama</h3>
      {out === null ? (
        <OutCount amount={outCount} />
      ) : (
        <OutNames out={out} outCount={outCount} />
      )}
    </section>
  );
}
