import Link from "next/link";
import { PageHead } from "@/ui/page-head";
import { ClarificationTasks } from "./clarification-tasks";
import { CleaningTasks } from "./cleaning-tasks";
import { LeaveTasks } from "./leave-tasks";
import { ReturnTasks } from "./return-tasks";
import { type TaskNumber, TaskNumbers } from "./task-numbers";
import { TaskSection } from "./task-section";
import styles from "./tasks.module.css";
import {
  ALL_ASSESSED_ADDRESS,
  ALL_DUE_ADDRESS,
  ALL_PASSED_ON_ADDRESS,
  ALL_WAITING_LEAVE_ADDRESS,
  ALL_WAITING_REPORTS_ADDRESS,
  CLARIFICATION_SECTION_ID,
  CLEANING_SECTION_ID,
  LATE_ADDRESS,
  LEAVE_SECTION_ID,
  RETURN_SECTION_ID,
  WAITING_APPEALS_ADDRESS,
  WARNING_SECTION_ID,
} from "./tasks-address";
import {
  type ClarificationTask,
  type CleaningTask,
  type DormTasks,
  type LeaveTask,
  type ReturnTask,
  type TaskSection as Section,
  type WarningTask,
  waitingIn,
} from "./tasks-card";
import { WarningTasks } from "./warning-tasks";

function AllClear() {
  return (
    <p className={styles.box}>
      <b>Semua tugas sudah beres.</b> Tidak ada yang menunggu tindakan Anda saat
      ini.
    </p>
  );
}

function OutLateLine({ outLate }: { outLate: number }) {
  return (
    <>
      {outLate} mahasiswa belum kembali melewati batas izin (
      <Link href={LATE_ADDRESS}>Perizinan asrama</Link>)
    </>
  );
}

function WaitingAppealsLine({ waitingAppeals }: { waitingAppeals: number }) {
  return (
    <>
      {waitingAppeals} advokasi pelanggaran menunggu keputusan BAM (
      <Link href={WAITING_APPEALS_ADDRESS}>Pelanggaran asrama</Link>)
    </>
  );
}

/**
 * Perlu dipantau: the residents still out past their return time and the
 * advokasi that wait for BAM, each only when there are any. No decision
 * of Pengelola Asrama, so neither counts toward the number in the menu.
 */
function WatchBox({ tasks }: { tasks: DormTasks }) {
  const outLate = tasks.outLate ?? 0;
  const waitingAppeals = tasks.waitingAppeals ?? 0;
  const anyOutLate = outLate > 0;
  const anyAppeals = waitingAppeals > 0;
  if (!anyOutLate && !anyAppeals) return null;
  return (
    <p className={`${styles.box} ${styles.watch}`}>
      <b>Perlu dipantau:</b> {anyOutLate && <OutLateLine outLate={outLate} />}
      {anyOutLate && anyAppeals && "; "}
      {anyAppeals && <WaitingAppealsLine waitingAppeals={waitingAppeals} />}.
    </p>
  );
}

/** One number card for each section the account has. */
function numbersOf(tasks: DormTasks): TaskNumber[] {
  const numbers: TaskNumber[] = [];
  if (tasks.leaves) {
    numbers.push({
      label: "Izin menunggu persetujuan",
      amount: tasks.leaves.total,
      sectionId: LEAVE_SECTION_ID,
    });
  }
  if (tasks.returns) {
    numbers.push({
      label: "Laporan kembali",
      amount: tasks.returns.total,
      sectionId: RETURN_SECTION_ID,
    });
  }
  if (tasks.clarifications) {
    numbers.push({
      label: "Klarifikasi kehadiran asrama",
      amount: tasks.clarifications.total,
      sectionId: CLARIFICATION_SECTION_ID,
    });
  }
  if (tasks.cleaning) {
    numbers.push({
      label: "Penilaian kebersihan",
      amount: tasks.cleaning.total,
      sectionId: CLEANING_SECTION_ID,
    });
  }
  if (tasks.warnings) {
    numbers.push({
      label: "Penetapan SP",
      amount: tasks.warnings.total,
      sectionId: WARNING_SECTION_ID,
    });
  }
  return numbers;
}

function LeaveSection({ section }: { section: Section<LeaveTask> }) {
  return (
    <TaskSection
      id={LEAVE_SECTION_ID}
      title="Izin menunggu persetujuan"
      purpose="Setujui atau tolak pengajuan izin pesiar, ITMK, dan izin khusus. Penolakan wajib disertai catatan."
      total={section.total}
      shown={section.items.length}
      all={{ address: ALL_WAITING_LEAVE_ADDRESS, tab: "Perizinan asrama" }}
    >
      <LeaveTasks tasks={section.items} />
    </TaskSection>
  );
}

function ReturnSection({ section }: { section: Section<ReturnTask> }) {
  return (
    <TaskSection
      id={RETURN_SECTION_ID}
      title="Laporan kembali menunggu validasi"
      purpose="Sudah diverifikasi BAM. Validasi menandai mahasiswa sudah kembali ke asrama."
      total={section.total}
      shown={section.items.length}
      all={{ address: ALL_WAITING_REPORTS_ADDRESS, tab: "Perizinan asrama" }}
    >
      <ReturnTasks tasks={section.items} />
    </TaskSection>
  );
}

function ClarificationSection({
  section,
}: {
  section: Section<ClarificationTask>;
}) {
  return (
    <TaskSection
      id={CLARIFICATION_SECTION_ID}
      title="Klarifikasi kehadiran asrama menunggu validasi"
      purpose="Sudah diterima BAM. Terima sebagai hadir atau izin, atau tolak. Penolakan memicu penetapan SP."
      total={section.total}
      shown={section.items.length}
      all={{
        address: ALL_PASSED_ON_ADDRESS,
        tab: "Klarifikasi kehadiran asrama",
      }}
    >
      <ClarificationTasks tasks={section.items} />
    </TaskSection>
  );
}

function CleaningSection({ section }: { section: Section<CleaningTask> }) {
  return (
    <TaskSection
      id={CLEANING_SECTION_ID}
      title="Penilaian kebersihan menunggu validasi"
      purpose="Sudah dinilai BAM. Memenuhi memberi +1 poin, tidak memenuhi −1 poin dan menjadwalkan pembersihan ulang."
      total={section.total}
      shown={section.items.length}
      all={{ address: ALL_ASSESSED_ADDRESS, tab: "Pembersihan asrama" }}
    >
      <CleaningTasks tasks={section.items} />
    </TaskSection>
  );
}

function WarningSection({ section }: { section: Section<WarningTask> }) {
  return (
    <TaskSection
      id={WARNING_SECTION_ID}
      title="Penetapan SP"
      purpose="Mahasiswa yang memenuhi ketentuan SP dari pelanggaran asrama atau klarifikasi kehadiran yang ditolak."
      total={section.total}
      shown={section.items.length}
      all={{ address: ALL_DUE_ADDRESS, tab: "Pelanggaran asrama" }}
    >
      <WarningTasks tasks={section.items} />
    </TaskSection>
  );
}

/**
 * Tugas saya of Pengelola Asrama: the title, what the page is for,
 * "Semua tugas sudah beres." while nothing waits for them, and a section
 * for each kind of item they may decide.
 */
export function DormTasksScreen({ tasks }: { tasks: DormTasks }) {
  return (
    <>
      <PageHead title="Tugas saya">
        Semua hal yang menunggu tindakan Pengelola Asrama dalam satu halaman:
        persetujuan izin, validasi laporan kembali, klarifikasi kehadiran,
        penilaian kebersihan, dan penetapan SP. Selesaikan langsung di sini
        tanpa berpindah menu.
      </PageHead>
      {waitingIn(tasks) === 0 && <AllClear />}
      <TaskNumbers numbers={numbersOf(tasks)} />
      <WatchBox tasks={tasks} />
      {tasks.leaves && <LeaveSection section={tasks.leaves} />}
      {tasks.returns && <ReturnSection section={tasks.returns} />}
      {tasks.clarifications && (
        <ClarificationSection section={tasks.clarifications} />
      )}
      {tasks.cleaning && <CleaningSection section={tasks.cleaning} />}
      {tasks.warnings && <WarningSection section={tasks.warnings} />}
    </>
  );
}
