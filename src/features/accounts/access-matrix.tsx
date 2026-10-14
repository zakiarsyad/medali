import { PAGES } from "@/auth/pages";
import { ROLE_IDS } from "@/auth/role-ids";
import { ACTION_TITLES, type Action, ROLES } from "@/auth/roles";
import styles from "@/ui/data-screen.module.css";

function pageTitles(pages: readonly string[]): string {
  return PAGES.filter((page) => pages.includes(page.id))
    .map((page) => page.title)
    .join(", ");
}

function Rights({ actions }: { actions: readonly Action[] }) {
  if (actions.length === 0) return "-";
  const last = actions.length - 1;
  return (
    <ul className={styles.lines}>
      {actions.map((action, index) => (
        <li key={action}>
          {ACTION_TITLES[action]}
          {index < last && <span className={styles.comma}>, </span>}
        </li>
      ))}
    </ul>
  );
}

/** What each role may open and do, read from the one permission list. */
export function AccessMatrix() {
  return (
    <div className={styles.tableWrap}>
      <table
        className={`${styles.table} ${styles.stacked} ${styles.titlesAbove}`}
      >
        <thead>
          <tr>
            <th>Peran</th>
            <th>Menu</th>
            <th>Tindakan</th>
          </tr>
        </thead>
        <tbody>
          {ROLE_IDS.map((role) => (
            <tr key={role}>
              <td className={styles.rowHeading} data-title="Peran">
                <b>{ROLES[role].title}</b>
              </td>
              <td data-title="Menu">{pageTitles(ROLES[role].pages)}</td>
              <td data-title="Tindakan">
                <Rights actions={ROLES[role].actions} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
