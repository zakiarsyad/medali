import Form from "next/form";
import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { AddResidentForm } from "./add-resident-form";
import type { NonResidents } from "./non-residents";
import { NO_PERIOD } from "./place-resident";
import styles from "./rooms.module.css";
import {
  addingAddress,
  ROOMS_ADDRESS,
  type RoomsParams,
  roomsAddress,
} from "./rooms-address";

function Search({ params }: { params: RoomsParams }) {
  return (
    <Form action={ROOMS_ADDRESS} className={styles.search}>
      <input type="hidden" name="asrama" value={params.dorm} />
      <input type="hidden" name="lantai" value={params.floor} />
      <input type="hidden" name="tambah" value="1" />
      <input
        name="cari"
        className={shared.input}
        placeholder="Cari nama atau NIM"
        defaultValue={params.adding ?? ""}
        aria-label="Cari nama atau NIM mahasiswa non asrama"
      />
      <button type="submit" className={shared.quiet}>
        Cari
      </button>
      {params.adding && (
        <Link
          href={addingAddress(params.dorm, params.floor)}
          className={shared.link}
        >
          Tampilkan semua
        </Link>
      )}
    </Form>
  );
}

/** How many students can be chosen, and what to do when not all are listed. */
function offeredWords(found: NonResidents): string {
  const { shown, matching } = found;
  if (matching === 0) {
    return "Tidak ada mahasiswa aktif non asrama pada filter ini.";
  }
  const all = `${matching.toLocaleString("id-ID")} mahasiswa non asrama dapat dipilih`;
  if (matching <= shown.length) return `${all}.`;
  return `${all}, ${shown.length} pertama ada di pilihan. Cari nama atau NIM untuk mempersempit.`;
}

/**
 * The panel "Tambah penghuni": a search, and the form that offers the
 * active students who live in no dorm. Without them no academic period
 * runs, and nobody can be added.
 */
export function AddResidentPanel({
  params,
  found,
}: {
  params: RoomsParams;
  /** The students who can be added. Null while no academic period runs. */
  found: NonResidents | null;
}) {
  return (
    <section className={shared.panel}>
      <div className={styles.head}>
        <h2 className={`${shared.heading} ${styles.title}`}>Tambah penghuni</h2>
        <Link
          href={roomsAddress(params.dorm, params.floor)}
          className={shared.link}
        >
          Tutup
        </Link>
      </div>
      {found === null ? (
        <p className={styles.quietLine} role="status">
          {NO_PERIOD.error}
        </p>
      ) : (
        <>
          {/* Made anew for each address, so the field shows what was searched. */}
          <Search key={params.adding} params={params} />
          <p className={styles.quietLine}>{offeredWords(found)}</p>
          <AddResidentForm offered={found.shown} openDorm={params.dorm} />
        </>
      )}
    </section>
  );
}
