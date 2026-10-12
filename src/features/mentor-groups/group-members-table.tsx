import Link from "next/link";
import type { ReactNode } from "react";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import shared from "@/ui/data-screen.module.css";
import { PressableRow } from "@/ui/pressable-row";
import pressable from "@/ui/pressable-row.module.css";
import type { GroupMember } from "./group-detail";
import { isOnLeave, memberSemester } from "./member-rules";

/** The name, as a link to the member's detail for an account that may open it. */
function MemberName({
  member,
  detailAddress,
}: {
  member: GroupMember;
  detailAddress: string | null;
}) {
  if (detailAddress === null) return <b>{member.name}</b>;
  return (
    <Link href={detailAddress} scroll={false} className={pressable.open}>
      <b>{member.name}</b>
    </Link>
  );
}

function MemberRow({
  detailAddress,
  children,
}: {
  detailAddress: string | null;
  children: ReactNode;
}) {
  if (detailAddress === null) return <tr>{children}</tr>;
  return <PressableRow address={detailAddress}>{children}</PressableRow>;
}

export function GroupMembersTable<Member extends GroupMember>({
  members,
  period,
  detailAddressOf,
  groupOf,
}: {
  members: Member[];
  /** The academic period that runs now, which says each member's semester. */
  period: AcademicPeriod | null;
  /**
   * The address that opens the detail of a member, or null for an account
   * that may not open any: its rows are then no links. Neither is the row
   * of a member whose detail the account may not open.
   */
  detailAddressOf: ((studentId: string) => string) | null;
  /**
   * The code of the group a member is in, for a list that holds members
   * of more than one group. Without it the list has no Kelompok column:
   * the page of a group needs none.
   */
  groupOf?: (member: Member) => string;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            {groupOf && <th>Kelompok</th>}
            <th>Kelas akademik</th>
            <th>Semester</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const detailAddress = member.opensDetail
              ? (detailAddressOf?.(member.id) ?? null)
              : null;
            return (
              <MemberRow key={member.id} detailAddress={detailAddress}>
                <td data-title="Mahasiswa">
                  <MemberName member={member} detailAddress={detailAddress} />
                  <small className={shared.detail}>{member.nim}</small>
                  {isOnLeave(member) && (
                    <span className={shared.badge}>Cuti</span>
                  )}
                </td>
                {groupOf && <td data-title="Kelompok">{groupOf(member)}</td>}
                <td data-title="Kelas akademik">{member.className ?? "-"}</td>
                <td data-title="Semester">
                  {memberSemester(member, period) ?? "-"}
                </td>
              </MemberRow>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
