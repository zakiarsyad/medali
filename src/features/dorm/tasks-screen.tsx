import { PageHead } from "@/ui/page-head";
import { LeaveTasks } from "./leave-tasks";
import { ReturnTasks } from "./return-tasks";
import { TaskSection } from "./task-section";
import styles from "./tasks.module.css";
import {
  ALL_WAITING_LEAVE_ADDRESS,
  ALL_WAITING_REPORTS_ADDRESS,
  LEAVE_SECTION_ID,
  RETURN_SECTION_ID,
} from "./tasks-address";
import {
  type DormTasks,
  type LeaveTask,
  type ReturnTask,
  type TaskSection as Section,
  waitingIn,
} from "./tasks-card";

function AllClear() {
  return (
    <p className={styles.box}>
      <b>Semua tugas sudah beres.</b> Tidak ada yang menunggu tindakan Anda saat
      ini.
    </p>
  );
}

function LeaveSection({ section }: { section: Section<LeaveTask> }) {
  return (
    <TaskSection
      id={LEAVE_SECTION_ID}
      title="Izin menunggu persetujuan"
      purpose="Setujui atau tolak pengajuan izin pesiar, ITMK, dan izin khusus. Penolakan wajib disertai catatan."
      total={section.total}
      shown={section.items.length}
      allAddress={ALL_WAITING_LEAVE_ADDRESS}
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
      allAddress={ALL_WAITING_REPORTS_ADDRESS}
    >
      <ReturnTasks tasks={section.items} />
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
        persetujuan izin dan validasi laporan kembali. Selesaikan langsung di
        sini tanpa berpindah menu.
      </PageHead>
      {waitingIn(tasks) === 0 && <AllClear />}
      {tasks.leaves && <LeaveSection section={tasks.leaves} />}
      {tasks.returns && <ReturnSection section={tasks.returns} />}
    </>
  );
}
