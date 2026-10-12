import { ROLES } from "@/auth/roles";
import { database } from "@/db/database";
import { listStudyPrograms } from "@/db/study-programs";
import styles from "@/ui/data-screen.module.css";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { AccessMatrix } from "./access-matrix";
import { AccountTable } from "./account-table";
import { AddAccountForm } from "./add-account-form";
import { BamPanel } from "./bam-panel";
import {
  BAM_PAGE_PARAM,
  type ListParams,
  listAddress,
  USERS_ADDRESS,
} from "./list-address";
import { listBamStudents } from "./list-bam-students";
import { ListPager } from "./list-pager";
import { listManagedAccounts, PAGE_SIZE } from "./manage-accounts";
import { LISTED_ROLES } from "./managed-roles";

function Filters({ params }: { params: ListParams }) {
  return (
    <form action={USERS_ADDRESS} className={styles.filters}>
      <input
        name="q"
        className={styles.input}
        placeholder="Cari nama, NIP, atau email"
        defaultValue={params.query}
        aria-label="Cari"
      />
      <select
        name="peran"
        className={styles.input}
        defaultValue={params.role ?? ""}
        aria-label="Peran"
      >
        <option value="">Semua peran</option>
        {LISTED_ROLES.map((role) => (
          <option key={role} value={role}>
            {ROLES[role].title}
          </option>
        ))}
      </select>
      {params.bamPage > 0 && (
        <input type="hidden" name={BAM_PAGE_PARAM} value={params.bamPage + 1} />
      )}
      <button type="submit" className={styles.quiet}>
        Cari
      </button>
    </form>
  );
}

export async function UsersScreen({
  params,
  tabs,
}: {
  params: ListParams;
  tabs: TabLinksProps;
}) {
  const db = database();
  const [list, programs, bamList] = await Promise.all([
    listManagedAccounts(db, params),
    listStudyPrograms(db),
    listBamStudents(db, params.bamPage),
  ]);
  return (
    <>
      <PageHead title="Pengaturan pengguna">
        Tambah, hapus, atau edit peran akun (satu orang boleh punya lebih dari
        satu peran) pengasuh, pembina disiplin mahasiswa, konselor, penilai
        mahasiswa, pegawai UPK, pengelola asrama, Badan Asrama Mahasiswa, ketua
        program studi, serta direktur dan wakil direktur.
      </PageHead>
      <TabLinks {...tabs} />
      <AddAccountForm programs={programs} />
      <section className={styles.panel}>
        <Filters params={params} />
        <AccountTable
          accounts={list.accounts}
          filter={params}
          editing={params.editing}
          programs={programs}
        />
        {list.total > 0 && (
          <ListPager
            page={params.page}
            pageSize={PAGE_SIZE}
            total={list.total}
            unit="pengguna"
            addressOf={(page) => listAddress({ ...params, page })}
          />
        )}
        <p className={styles.detail}>
          Peran Kepala Unit Pembangunan Karakter tidak diberikan atau dilepas di
          sini, dan akunnya tidak bisa dihapus. Akun mahasiswa mengikuti data
          akademik dan tidak ditampilkan; peran BAM mahasiswa diatur pada panel
          Badan Asrama Mahasiswa di bawah.
        </p>
      </section>
      <BamPanel list={bamList} params={params} />
      <section className={styles.panel}>
        <h2 className={styles.heading}>Hak akses tiap peran</h2>
        <p className={styles.detail}>
          Menu dan tindakan yang dapat dilakukan setiap peran.
        </p>
        <AccessMatrix />
      </section>
    </>
  );
}
