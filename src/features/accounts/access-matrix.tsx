import { PAGES } from "@/auth/pages";
import { ROLE_IDS } from "@/auth/role-ids";
import { ACTION_TITLES, ROLES } from "@/auth/roles";
import styles from "@/ui/data-screen.module.css";

function pageTitles(pages: readonly string[]): string {
  return PAGES.filter((page) => pages.includes(page.id))
    .map((page) => page.title)
    .join(", ");
}

/** What each role may open and do, read from the one permission list. */
export function AccessMatrix() {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
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
              <td>
                <b>{ROLES[role].title}</b>
              </td>
              <td>{pageTitles(ROLES[role].pages)}</td>
              <td>
                {ROLES[role].actions
                  .map((action) => ACTION_TITLES[action])
                  .join(", ") || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
