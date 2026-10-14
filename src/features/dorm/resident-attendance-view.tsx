import { DORM_NAMES, type DormId } from "@/dorms/dorms";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import styles from "./activities.module.css";
import { attendanceRate, rateWords } from "./attendance-rate";
import { CLARIFICATION_DAYS } from "./clarification-time";
import type { OwnAttendance } from "./resident-attendance";

/** The note on how attendance is counted, and the numbers under it. */
export function AttendanceNumbers({
  attendance,
  todayCount,
  dorm,
}: {
  attendance: OwnAttendance;
  /** How many activities the resident has today. */
  todayCount: number;
  dorm: DormId;
}) {
  const { present, absent } = attendance;
  const announced = present + absent;
  const rate = attendanceRate(present, announced) ?? 0;
  return (
    <>
      <p className={styles.note}>
        Kehadiran kegiatan asrama dihitung langsung di tempat kegiatan oleh
        Badan Asrama Mahasiswa. Setelah kegiatan, BAM mengumumkan
        ketidakhadiran. Kegiatan yang belum diumumkan belum dihitung. Kegiatan
        pada waktu izin pesiar atau izin khusus yang disetujui tercatat Izin dan
        tidak dihitung; pada waktu ITMK yang disetujui tercatat Hadir. Bila Anda
        tercatat tidak hadir, ajukan klarifikasi dari tabel riwayat paling
        lambat {CLARIFICATION_DAYS} hari setelah kegiatan.
      </p>
      <NumberCards>
        <NumberCard
          label="Kehadiran kegiatan asrama"
          amount={rateWords(rate)}
          note={`${present.toLocaleString("id-ID")} hadir dari ${announced.toLocaleString("id-ID")} kegiatan yang diumumkan`}
        />
        <NumberCard
          label="Tercatat tidak hadir"
          amount={absent}
          note="dapat diklarifikasi"
        />
        <NumberCard
          label="Kegiatan hari ini"
          amount={todayCount}
          note={DORM_NAMES[dorm]}
        />
        <NumberCard
          label="Klarifikasi aktif"
          amount={attendance.waitingClarifications}
          note="menunggu BAM atau pengelola"
        />
      </NumberCards>
    </>
  );
}
