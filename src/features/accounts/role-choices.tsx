import { ROLES } from "@/auth/roles";
import { MANAGED_ROLES } from "./managed-roles";
import type { StudyProgram } from "./study-programs";
import styles from "./users-screen.module.css";

export function RoleChoices({ chosen }: { chosen: readonly string[] }) {
  return (
    <fieldset className={styles.roles}>
      <legend className={styles.label}>Peran (boleh lebih dari satu)</legend>
      {MANAGED_ROLES.map((role) => (
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

export function ProgramChoice({
  programs,
  chosen,
}: {
  programs: StudyProgram[];
  chosen: number | null;
}) {
  return (
    <label className={styles.field}>
      Program studi (bila Ketua Program Studi)
      <select
        name="studyProgramId"
        className={styles.input}
        defaultValue={chosen === null ? "" : String(chosen)}
      >
        <option value="">-</option>
        {programs.map((program) => (
          <option key={program.id} value={program.id}>
            {program.name}
          </option>
        ))}
      </select>
    </label>
  );
}
