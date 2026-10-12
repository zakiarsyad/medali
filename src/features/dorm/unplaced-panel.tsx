import Form from "next/form";
import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { DORM_NAMES } from "./dorms";
import type { UnplacedResidents } from "./room-list";
import styles from "./rooms.module.css";
import { ROOMS_ADDRESS, type RoomsParams, roomsAddress } from "./rooms-address";

function emptyWords(params: RoomsParams, residents: number): string {
  if (params.query !== "") {
    return "Tidak ada penghuni belum diplot yang cocok. Ubah kata kunci.";
  }
  if (residents === 0) {
    return `Belum ada penghuni di ${DORM_NAMES[params.dorm]}.`;
  }
  return "Semua penghuni sudah diplot.";
}

function Search({ params }: { params: RoomsParams }) {
  return (
    <Form action={ROOMS_ADDRESS} className={styles.search}>
      <input type="hidden" name="asrama" value={params.dorm} />
      <input type="hidden" name="lantai" value={params.floor} />
      <input
        name="q"
        className={shared.input}
        placeholder="Cari nama atau NIM"
        defaultValue={params.query}
        aria-label="Cari nama atau NIM penghuni belum diplot"
      />
      <button type="submit" className={shared.quiet}>
        Cari
      </button>
      {params.query !== "" && (
        <Link
          href={roomsAddress(params.dorm, params.floor)}
          className={shared.link}
        >
          Tampilkan semua
        </Link>
      )}
    </Form>
  );
}

/** The residents of the dorm who have no room yet, with a search. */
export function UnplacedPanel({
  params,
  unplaced,
  residents,
  mayManage,
}: {
  params: RoomsParams;
  unplaced: UnplacedResidents;
  /** How many residents the dorm has in all. */
  residents: number;
  mayManage: boolean;
}) {
  const more = unplaced.matching - unplaced.shown.length;
  return (
    <section className={shared.panel}>
      <div className={styles.head}>
        <h2 className={`${shared.heading} ${styles.title}`}>Belum diplot</h2>
        <span className={styles.quietLine}>
          {unplaced.matching.toLocaleString("id-ID")} penghuni
        </span>
      </div>
      {/* Made anew for each address, so the field shows what was searched. */}
      <Search key={params.query} params={params} />
      {mayManage && unplaced.matching > 0 && (
        <p className={styles.quietLine}>
          Pilihan penghuni di kartu kamar mengikuti daftar ini.
        </p>
      )}
      {unplaced.matching === 0 ? (
        <p className={shared.empty}>{emptyWords(params, residents)}</p>
      ) : (
        <ul className={styles.names}>
          {unplaced.shown.map((resident) => (
            <li key={resident.id} className={styles.name} title={resident.nim}>
              {resident.name}
            </li>
          ))}
          {more > 0 && (
            <li className={styles.quietLine}>
              dan {more.toLocaleString("id-ID")} lainnya
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
