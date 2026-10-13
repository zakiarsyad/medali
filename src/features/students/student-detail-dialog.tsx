import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { ModalDialog } from "@/ui/modal-dialog";
import type { AskedDetail } from "./asked-detail";
import type { RunningPeriod } from "./semester-now";
import { StudentDetailView } from "./student-detail-view";
import type { GroupAddressOf, MentorAddressOf } from "./student-mentor-group";

/**
 * The panels another area adds under a student's own record, such as the
 * notes of their mentor. Each area decides who is shown its panel.
 */
export type MorePanelsOf = (studentId: string) => ReactNode;

/** The page a student's detail was opened from, where Tutup returns. */
export type DetailOpenedFrom =
  | "student_list"
  | "group_page"
  | "mentor_page"
  | "notes_list"
  | "scores_list";

const RETURN_PLACE: Record<DetailOpenedFrom, string> = {
  student_list: "daftar mahasiswa",
  group_page: "halaman kelompok",
  mentor_page: "halaman pengasuh",
  notes_list: "daftar catatan",
  scores_list: "daftar nilai",
};

/** The detail of one student, over the list it was opened from. */
export function StudentDetailDialog({
  detail,
  period,
  openedFrom,
  closeAddress,
  groupAddressOf,
  mentorAddressOf,
  morePanelsOf,
}: {
  detail: AskedDetail;
  period: RunningPeriod;
  openedFrom: DetailOpenedFrom;
  /** The address of the list as it was left. */
  closeAddress: string;
  groupAddressOf: GroupAddressOf;
  mentorAddressOf: MentorAddressOf;
  morePanelsOf: MorePanelsOf;
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
          untuk kembali ke {RETURN_PLACE[openedFrom]}.
        </p>
      </ModalDialog>
    );
  }
  return (
    <ModalDialog label="Profil mahasiswa" closeAddress={closeAddress}>
      <StudentDetailView
        student={detail.student}
        period={period}
        groupAddressOf={groupAddressOf}
        mentorAddressOf={mentorAddressOf}
      />
      {morePanelsOf(detail.student.id)}
    </ModalDialog>
  );
}
