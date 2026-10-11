import Link from "next/link";
import { ROLES } from "@/auth/roles";
import type { StudyProgram } from "@/db/study-programs";
import styles from "@/ui/data-screen.module.css";
import { listAddress } from "./list-address";
import type { AccountFilter, ManagedAccount } from "./manage-accounts";
import { isManagedRole } from "./managed-roles";
import { RemoveAccountButton } from "./remove-account-button";
import { RoleEditForm } from "./role-edit-form";

interface AccountTableProps {
  accounts: ManagedAccount[];
  filter: AccountFilter;
  editing: string | null;
  programs: StudyProgram[];
}

function fullName(account: ManagedAccount): string {
  return account.title ? `${account.name}, ${account.title}` : account.name;
}

function roleTitles(account: ManagedAccount): string {
  return account.roles.map((role) => ROLES[role].title).join(", ");
}

function AccountRow({
  account,
  filter,
  isEditing,
  programs,
}: {
  account: ManagedAccount;
  filter: AccountFilter;
  isEditing: boolean;
  programs: StudyProgram[];
}) {
  return (
    <>
      <tr>
        <td>
          <b>{fullName(account)}</b>
          <small className={styles.detail}>
            NIP {account.nip ?? "-"} · {account.email ?? "-"}
          </small>
        </td>
        <td>
          {account.roles.map((role) => (
            <span key={role} className={styles.badge}>
              {ROLES[role].title}
            </span>
          ))}
        </td>
        <td>{account.unit ?? "-"}</td>
        <td className={styles.detail}>
          {account.studyProgram ? `Kaprodi ${account.studyProgram}` : ""}
        </td>
        <td className={styles.rowActions}>
          {!isEditing && (
            <>
              <Link
                href={listAddress(filter, { edit: account.id })}
                className={styles.link}
              >
                Edit peran
              </Link>
              {account.roles.every(isManagedRole) && (
                <RemoveAccountButton
                  accountId={account.id}
                  name={account.name}
                  roles={roleTitles(account)}
                />
              )}
            </>
          )}
        </td>
      </tr>
      {isEditing && (
        <tr>
          <td colSpan={5}>
            <RoleEditForm
              account={account}
              programs={programs}
              back={listAddress(filter)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

export function AccountTable({
  accounts,
  filter,
  editing,
  programs,
}: AccountTableProps) {
  if (accounts.length === 0) {
    return <p className={styles.empty}>Tidak ada pengguna pada filter ini.</p>;
  }
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Pengguna</th>
            <th>Peran</th>
            <th>Unit atau jabatan</th>
            <th>Keterangan</th>
            <th>
              <span className={styles.hidden}>Tindakan</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              filter={filter}
              isEditing={account.id === editing}
              programs={programs}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
