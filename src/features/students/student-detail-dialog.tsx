import shared from "@/ui/data-screen.module.css";
import { ModalDialog } from "@/ui/modal-dialog";
import type { AskedDetail } from "./asked-detail";
import type { RunningPeriod } from "./semester-now";
import { StudentDetailView } from "./student-detail-view";

/** The detail of one student, over the list it was opened from. */
export function StudentDetailDialog({
  detail,
  period,
  closeAddress,
}: {
  detail: AskedDetail;
  period: RunningPeriod;
  /** The address of the list as it was left. */
  closeAddress: string;
}) {
  if (detail.kind === "not_found") {
    return (
      <ModalDialog
        label="Mahasiswa tidak ditemukan"
        closeAddress={closeAddress}
      >
        <h2 className={shared.heading}>Mahasiswa tidak ditemukan</h2>
        <p>
          Data mahasiswa ini tidak ada atau tidak dapat Anda lihat. Pilih Tutup
          untuk kembali ke daftar mahasiswa.
        </p>
      </ModalDialog>
    );
  }
  return (
    <ModalDialog label="Profil mahasiswa" closeAddress={closeAddress}>
      <StudentDetailView student={detail.student} period={period} />
    </ModalDialog>
  );
}
