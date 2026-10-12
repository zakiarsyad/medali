import { BAM_ROLES } from "@/auth/bam-roles";
import { ROLES } from "@/auth/roles";
import styles from "@/ui/data-screen.module.css";

export function BamRoleChoices({ chosen }: { chosen: readonly string[] }) {
  return (
    <fieldset className={styles.roles}>
      <legend className={styles.label}>
        Peran BAM (boleh lebih dari satu)
      </legend>
      {BAM_ROLES.map((role) => (
        <label key={role} className={styles.role}>
          <input
            type="checkbox"
            name="roles"
            value={role}
            defaultChecked={chosen.includes(role)}
          />
          {ROLES[role].title}
        </label>
      ))}
    </fieldset>
  );
}
