import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import { PageHead } from "@/ui/page-head";
import { listStudents } from "./student-list";
import { StudentListTable } from "./student-list-table";

export async function StudentListScreen({
  limit,
}: {
  /** Which student rows the account that opened the page may see. */
  limit: RowLimit;
}) {
  const list = await listStudents(database(), limit);
  return (
    <>
      <PageHead title="Mahasiswa">
        Data mahasiswa beserta program studi, angkatan, dan provinsi domisili.
      </PageHead>
      <section className={shared.panel}>
        <StudentListTable students={list.students} />
      </section>
    </>
  );
}
