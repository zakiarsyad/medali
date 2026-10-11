import styles from "./account-picker.module.css";
import type { Account } from "./accounts";
import { accountLabel, roleTitles } from "./signed-in-as";
import { switchAccount } from "./switch-account";

function detail(account: Account): string {
  const extra = account.studentProgram ?? account.unit;
  return extra ? `${roleTitles(account)} · ${extra}` : roleTitles(account);
}

export function AccountPicker({
  accounts,
  currentId,
}: {
  accounts: Account[];
  currentId: string | null;
}) {
  return (
    <ul className={styles.list}>
      {accounts.map((account) => (
        <li key={account.id}>
          <form action={switchAccount}>
            <input type="hidden" name="accountId" value={account.id} />
            <button
              type="submit"
              className={styles.account}
              aria-current={account.id === currentId ? "true" : undefined}
            >
              <b className={styles.name}>{accountLabel(account)}</b>
              <small className={styles.detail}>{detail(account)}</small>
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
