import shared from "@/ui/data-screen.module.css";
import { DAY, shownDay, shownMoment } from "@/ui/day";
import { ListPager } from "@/ui/list-pager";
import type {
  DisciplineProposal,
  DisciplineProposals,
} from "./discipline-proposals";
import { HandleProposalForm } from "./handle-proposal-form";
import {
  type StaffViolationParams,
  staffViolationsAddress,
} from "./violation-address";
import styles from "./violations.module.css";
import { WARNINGS_PAGE_SIZE } from "./warning-ids";

export const NO_PROPOSALS = "Belum ada pengajuan hukuman disiplin.";

/** What the account may do on a row besides reading it. */
export interface ProposalTools {
  /** Whether the account marks proposals Diproses: Kepala Unit. */
  handles: boolean;
  /** The student the account belongs to, whose row has no "Proses", or null. */
  ownStudentId: string | null;
}

function Status({
  proposal,
  tools,
}: {
  proposal: DisciplineProposal;
  tools: ProposalTools;
}) {
  const { handling } = proposal;
  if (handling !== null) {
    return (
      <>
        <span className={`${shared.badge} ${styles.ok}`}>Diproses</span>
        <p className={styles.note}>{handling.note}</p>
        <small className={shared.detail}>
          {handling.by} · {shownMoment(handling.at)}
        </small>
      </>
    );
  }
  const handles = tools.handles && proposal.studentId !== tools.ownStudentId;
  return (
    <>
      <span className={`${shared.badge} ${styles.warn}`}>Diajukan</span>
      {handles && (
        <HandleProposalForm letterId={proposal.letterId} name={proposal.name} />
      )}
    </>
  );
}

function ProposalRow({
  proposal,
  tools,
}: {
  proposal: DisciplineProposal;
  tools: ProposalTools;
}) {
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Mahasiswa">
        <b>{proposal.name}</b>
        <small className={shared.detail}>
          {proposal.nim} · {proposal.semesterTitle}
        </small>
      </td>
      <td data-title="Pelanggaran">
        <b>{proposal.counted.toLocaleString("id-ID")}</b>
      </td>
      <td data-title="Klarifikasi SP 2">
        {shownDay(proposal.clarifiedOn)}
        <p className={styles.note}>{proposal.result}</p>
      </td>
      <td data-title="Pengajuan">
        {DAY.format(proposal.proposedAt)}
        {proposal.proposalNote !== "" && (
          <p className={styles.note}>{proposal.proposalNote}</p>
        )}
      </td>
      <td data-title="Status">
        <Status proposal={proposal} tools={tools} />
      </td>
    </tr>
  );
}

function ProposalTable({
  proposals,
  tools,
}: {
  proposals: DisciplineProposal[];
  tools: ProposalTools;
}) {
  if (proposals.length === 0) {
    return <p className={shared.empty}>{NO_PROPOSALS}</p>;
  }
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Pelanggaran</th>
            <th>Klarifikasi SP 2</th>
            <th>Pengajuan</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal) => (
            <ProposalRow
              key={proposal.letterId}
              proposal={proposal}
              tools={tools}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * "Pengajuan hukuman disiplin dari Pengelola Asrama", for Pengelola
 * Asrama and Kepala Unit: each SP 2 with its proposal, 20 a page, and
 * whether it is Diajukan or Diproses. Kepala Unit also gets "Catatan
 * tindak lanjut" and "Proses" on a row still Diajukan, but not on the
 * row of their own student.
 */
export function ProposalsPanel({
  proposals,
  params,
  tools,
}: {
  proposals: DisciplineProposals;
  params: StaffViolationParams;
  tools: ProposalTools;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>
        Pengajuan hukuman disiplin dari Pengelola Asrama
      </h2>
      <p className={styles.sub}>
        Mahasiswa dengan SP 2 yang diajukan untuk proses hukuman disiplin
      </p>
      {/* Made anew for each page, so a note typed on one is not kept on another. */}
      <ProposalTable
        key={proposals.page}
        proposals={proposals.rows}
        tools={tools}
      />
      {proposals.matching > 0 && (
        <ListPager
          page={proposals.page}
          matching={proposals.matching}
          pageSize={WARNINGS_PAGE_SIZE}
          noun="pengajuan"
          keepsPlace
          stepsOnOnePage={false}
          addressOf={(page) =>
            staffViolationsAddress({ ...params, proposalPage: page })
          }
        />
      )}
    </section>
  );
}
