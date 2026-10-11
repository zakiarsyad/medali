import Link from "next/link";
import { ROLES } from "@/auth/roles";
import { database } from "@/db/database";
import { listStudyPrograms } from "@/db/study-programs";
import styles from "@/ui/data-screen.module.css";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { AccessMatrix } from "./access-matrix";
import { AccountTable } from "./account-table";
import { AddAccountForm } from "./add-account-form";
import { type ListParams, listAddress, USERS_ADDRESS } from "./list-address";
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
      <button type="submit" className={styles.quiet}>
        Cari
      </button>
    </form>
  );
}

function Pager({ params, total }: { params: ListParams; total: number }) {
  const from = params.page * PAGE_SIZE + 1;
  const to = Math.min(total, (params.page + 1) * PAGE_SIZE);
  const hasNext = to < total;
  return (
    <div className={styles.pager}>
      <span>
        {from}–{to} dari {total} pengguna
      </span>
      <span className={styles.actions}>
        {params.page > 0 && (
          <Link
            href={listAddress({ ...params, page: params.page - 1 })}
            className={styles.quiet}
          >
            Sebelumnya
          </Link>
        )}
        {hasNext && (
          <Link
            href={listAddress({ ...params, page: params.page + 1 })}
            className={styles.quiet}
          >
            Berikutnya
          </Link>
        )}
      </span>
    </div>
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
  const [list, programs] = await Promise.all([
    listManagedAccounts(db, params),
    listStudyPrograms(db),
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
        {list.total > 0 && <Pager params={params} total={list.total} />}
        <p className={styles.detail}>
          Peran Kepala Unit Pembangunan Karakter tidak diberikan atau dilepas di
          sini, dan akunnya tidak bisa dihapus. Akun mahasiswa mengikuti data
          akademik dan tidak ditampilkan.
        </p>
      </section>
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
