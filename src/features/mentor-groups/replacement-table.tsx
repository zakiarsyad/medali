import Link from "next/link";
import type { RowLimit } from "@/auth/access";
import { REPLACEMENT_REASON_TITLES } from "@/mentoring/replacement-ids";
import shared from "@/ui/data-screen.module.css";
import { DAY, shownDay } from "@/ui/day";
import { groupCode } from "@/ui/group-code";
import { MENTOR_STATUS_TITLES } from "@/ui/mentor-status";
import { CancelReplacementButton } from "./cancel-replacement-button";
import { groupAddress } from "./group-list-address";
import type { ListedReplacement } from "./replacement-rows";
import { REPLACEMENT_STATUS_TITLES } from "./replacement-status";
import { cancelQuestion } from "./replacement-words";
import { maySeeGroup } from "./visible-groups";

const BETWEEN = " · ";

/** What the account that looks at the list may do with its rows. */
export interface ReplacementRowRights {
  /** The groups whose page the account may open, or null for none. */
  groupLimit: RowLimit | null;
  /** Whether the account may cancel a replacement that waits. */
  mayCancel: boolean;
}

function GroupCell({
  replacement,
  groupLimit,
}: {
  replacement: ListedReplacement;
  groupLimit: RowLimit | null;
}) {
  const { group } = replacement;
  const code = groupCode(group);
  const opensPage =
    groupLimit !== null && maySeeGroup(groupLimit, group.studyProgramId);
  return (
    <td data-title="Kelompok">
      {opensPage ? (
        <Link href={groupAddress(group.id)} className={shared.link}>
          {code}
        </Link>
      ) : (
        code
      )}
      <small className={shared.detail}>
        {replacement.members.toLocaleString("id-ID")} mahasiswa
      </small>
    </td>
  );
}

function StatusCell({
  replacement,
  mayCancel,
}: {
  replacement: ListedReplacement;
  mayCancel: boolean;
}) {
  const { cancelled } = replacement;
  return (
    <td data-title="Status">
      <span className={shared.badge}>
        {REPLACEMENT_STATUS_TITLES[replacement.status]}
      </span>
      {cancelled !== null && (
        <small className={shared.detail}>
          {DAY.format(cancelled.at)}
          {BETWEEN}
          {cancelled.by}
        </small>
      )}
      {mayCancel && (
        <CancelReplacementButton
          replacementId={replacement.id}
          isWaiting={replacement.status === "scheduled"}
          question={cancelQuestion({
            groupCode: groupCode(replacement.group),
            newMentorName: replacement.newMentorName,
            startsOn: replacement.startsOn,
          })}
        />
      )}
    </td>
  );
}

function ReplacementRow({
  replacement,
  rights,
}: {
  replacement: ListedReplacement;
  rights: ReplacementRowRights;
}) {
  const becomes = MENTOR_STATUS_TITLES[replacement.oldMentorStatus];
  return (
    <tr>
      <td data-title="Tanggal efektif">{shownDay(replacement.startsOn)}</td>
      <GroupCell replacement={replacement} groupLimit={rights.groupLimit} />
      <td data-title="Pengasuh lama">
        {replacement.oldMentorName}
        <small className={shared.detail}>menjadi {becomes.toLowerCase()}</small>
      </td>
      <td data-title="Pengganti">{replacement.newMentorName}</td>
      <td data-title="Alasan">
        {REPLACEMENT_REASON_TITLES[replacement.reason]}
        {replacement.note !== null && (
          <small className={shared.detail}>{replacement.note}</small>
        )}
      </td>
      <td data-title="Surat">{replacement.letterNumber}</td>
      <StatusCell replacement={replacement} mayCancel={rights.mayCancel} />
    </tr>
  );
}

/**
 * "Riwayat penggantian": the start date, the group and its size, the old
 * mentor and what they became, the new mentor, the reason with its note,
 * the letter number and the status. A row that waits has "Batalkan" for
 * an account that may cancel.
 */
export function ReplacementTable({
  replacements,
  rights,
}: {
  replacements: ListedReplacement[];
  rights: ReplacementRowRights;
}) {
  if (replacements.length === 0) {
    return <p className={shared.empty}>Belum ada penggantian pengasuh.</p>;
  }
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Tanggal efektif</th>
            <th>Kelompok</th>
            <th>Pengasuh lama</th>
            <th>Pengganti</th>
            <th>Alasan</th>
            <th>Surat</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {replacements.map((replacement) => (
            <ReplacementRow
              key={replacement.id}
              replacement={replacement}
              rights={rights}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
