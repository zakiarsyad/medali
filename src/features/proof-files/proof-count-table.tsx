import shared from "@/ui/data-screen.module.css";
import type { ProofCounts } from "./proof-counts";
import { PROOF_KIND_TITLES, PROOF_KINDS } from "./proof-kinds";

/** One row per kind of proof file: how many are kept and how many may go now. */
export function ProofCountTable({ counts }: { counts: ProofCounts }) {
  return (
    <div className={shared.tableWrap}>
      <table className={shared.table}>
        <thead>
          <tr>
            <th>Jenis berkas</th>
            <th>Disimpan</th>
            <th>Dapat dihapus sekarang</th>
          </tr>
        </thead>
        <tbody>
          {PROOF_KINDS.map((kind) => (
            <tr key={kind}>
              <td data-title="Jenis berkas">{PROOF_KIND_TITLES[kind]}</td>
              <td data-title="Disimpan">
                {counts.kept[kind].toLocaleString("id-ID")}
              </td>
              <td data-title="Dapat dihapus sekarang">
                {counts.removable[kind].toLocaleString("id-ID")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
