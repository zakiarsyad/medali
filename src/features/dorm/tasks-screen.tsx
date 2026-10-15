import Link from "next/link";
import { PageHead } from "@/ui/page-head";
import { LeaveTasks } from "./leave-tasks";
import { ReturnTasks } from "./return-tasks";
import { type TaskNumber, TaskNumbers } from "./task-numbers";
import { TaskSection } from "./task-section";
import styles from "./tasks.module.css";
import {
  ALL_WAITING_LEAVE_ADDRESS,
  ALL_WAITING_REPORTS_ADDRESS,
  LATE_ADDRESS,
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

/** Perlu dipantau: the residents still out past their return time. */
function WatchBox({ outLate }: { outLate: number }) {
  return (
    <p className={`${styles.box} ${styles.watch}`}>
      <b>Perlu dipantau:</b> {outLate} mahasiswa belum kembali melewati batas
      izin (<Link href={LATE_ADDRESS}>Perizinan asrama</Link>).
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
      <TaskNumbers numbers={numbersOf(tasks)} />
      {tasks.outLate !== null && tasks.outLate > 0 && (
        <WatchBox outLate={tasks.outLate} />
      )}
      {tasks.leaves && <LeaveSection section={tasks.leaves} />}
      {tasks.returns && <ReturnSection section={tasks.returns} />}
    </>
  );
}
