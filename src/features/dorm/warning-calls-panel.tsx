import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import {
  type StaffViolationParams,
  staffViolationsAddress,
} from "./violation-address";
import styles from "./violations.module.css";
import type { WarningCall, WarningCalls } from "./warning-calls";
import {
  SP1_VIOLATIONS,
  SP2_VIOLATIONS,
  WARNINGS_PAGE_SIZE,
  type WarningLevel,
} from "./warning-ids";
import { causeWords, scheduleWords } from "./warning-words";

export const NO_CALLS = "Tidak ada panggilan klarifikasi aktif.";

/** The mark of an SP already issued, as "SP 1" or "SP 2". */
export function LetterMark({ level }: { level: WarningLevel | null }) {
  if (level === null) return null;
  return <span className={`${shared.badge} ${styles.bad}`}>SP {level}</span>;
}

function CallRow({ call }: { call: WarningCall }) {
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Mahasiswa">
        <b>{call.name}</b>
        <small className={shared.detail}>
          {call.nim} · {call.room}
        </small>
      </td>
      <td data-title="Pelanggaran">
        <b>{call.counted.toLocaleString("id-ID")}</b>
      </td>
      <td data-title="Panggilan">
        <span className={`${shared.badge} ${styles.warn}`}>
          Penetapan SP {call.level}
        </span>{" "}
        <LetterMark level={call.mark} />
        <p className={styles.sub}>{causeWords(call.causes)}</p>
      </td>
      <td data-title="Jadwal">{scheduleWords(call.schedule)}</td>
    </tr>
  );
}

function CallTable({ calls }: { calls: WarningCall[] }) {
  if (calls.length === 0) return <p className={shared.empty}>{NO_CALLS}</p>;
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Pelanggaran</th>
            <th>Panggilan</th>
            <th>Jadwal</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => (
            <CallRow key={call.studentId} call={call} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * "Panggilan klarifikasi dan surat peringatan": each resident called for
 * an SP in the running semester, with why, the SP already issued and the
 * schedule of the call, 20 a page.
 */
export function WarningCallsPanel({
  calls,
  params,
}: {
  calls: WarningCalls;
  params: StaffViolationParams;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>
        Panggilan klarifikasi dan surat peringatan
      </h2>
      <p className={styles.sub}>
        SP 1 ditetapkan bila dalam satu semester tercatat {SP1_VIOLATIONS}{" "}
        pelanggaran atau klarifikasi kehadiran kegiatan asrama ditolak. SP 2
        beserta pengajuan hukuman disiplin ke Kepala UPK ditetapkan bila setelah
        SP 1 tercatat {SP2_VIOLATIONS - SP1_VIOLATIONS} pelanggaran lagi atau
        klarifikasi kehadiran ditolak lagi.
      </p>
      <CallTable calls={calls.calls} />
      {calls.active > 0 && (
        <ListPager
          page={calls.page}
          matching={calls.active}
          pageSize={WARNINGS_PAGE_SIZE}
          noun="mahasiswa"
          keepsPlace
          stepsOnOnePage={false}
          addressOf={(page) =>
            staffViolationsAddress({ ...params, callPage: page })
          }
        />
      )}
    </section>
  );
}
