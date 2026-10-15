import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import type { ReductionList } from "./reduction-list";
import { ReductionsTable } from "./reductions-table";
import {
  type StaffViolationParams,
  staffViolationsAddress,
} from "./violation-address";
import { VIOLATIONS_PAGE_SIZE } from "./violation-ids";
import styles from "./violations.module.css";

/**
 * "Riwayat pengurangan pelanggaran" of the semester of the rekap, for
 * Pengelola Asrama and Kepala Unit, with "Batalkan" for an account that
 * `undoes`. Made anew for each page, so an answer shown on one is not
 * kept on another.
 */
export function ReductionsPanel({
  reductions,
  params,
  undoes,
  ownStudentId,
}: {
  reductions: ReductionList;
  params: StaffViolationParams;
  undoes: boolean;
  ownStudentId: string | null;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Riwayat pengurangan pelanggaran</h2>
      <p className={styles.sub}>
        Pelanggaran yang dikurangi Pengelola Asrama karena klarifikasinya
        diterima. Data ini tidak lagi tampil di pengumuman.
      </p>
      <ReductionsTable
        key={reductions.page}
        rows={reductions.rows}
        undoes={undoes}
        ownStudentId={ownStudentId}
      />
      {reductions.matching > 0 && (
        <ListPager
          page={reductions.page}
          matching={reductions.matching}
          pageSize={VIOLATIONS_PAGE_SIZE}
          noun="pengurangan"
          keepsPlace
          stepsOnOnePage={false}
          addressOf={(page) =>
            staffViolationsAddress({ ...params, reductionPage: page })
          }
        />
      )}
    </section>
  );
}
