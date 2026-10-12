import styles from "@/ui/data-screen.module.css";
import { AddBamForm } from "./add-bam-form";
import { BamStudentList } from "./bam-student-list";
import { type ListParams, listAddress } from "./list-address";
import {
  BAM_PAGE_SIZE,
  type BamStudentList as Listed,
} from "./list-bam-students";
import { ListPager } from "./list-pager";

interface BamPanelProps {
  list: Listed;
  params: ListParams;
}

/** The students who hold a role of Badan Asrama Mahasiswa. */
export function BamPanel({ list, params }: BamPanelProps) {
  return (
    <section className={styles.panel}>
      <h2 className={styles.heading}>Badan Asrama Mahasiswa</h2>
      <p className={styles.detail}>
        Mahasiswa yang memegang peran BAM. Perannya berlaku di samping peran
        Mahasiswa, selama mahasiswa berstatus aktif.
      </p>
      <AddBamForm />
      <BamStudentList
        students={list.students}
        view={params}
        editing={params.bamEditing}
      />
      {list.total > 0 && (
        <ListPager
          page={list.page}
          pageSize={BAM_PAGE_SIZE}
          total={list.total}
          unit="mahasiswa"
          addressOf={(bamPage) => listAddress({ ...params, bamPage })}
        />
      )}
    </section>
  );
}
