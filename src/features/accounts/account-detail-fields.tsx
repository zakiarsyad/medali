import styles from "@/ui/data-screen.module.css";
import { NAME_MAX_LENGTH, TITLE_MAX_LENGTH } from "./account-limits";

export interface DetailDefaults {
  name: string;
  title: string | null;
  nip: string | null;
  email: string | null;
}

const EMPTY: DetailDefaults = { name: "", title: null, nip: null, email: null };

/** Nama lengkap, Gelar, NIP and Email kedinasan, empty or filled in. */
export function AccountDetailFields({
  defaults = EMPTY,
}: {
  defaults?: DetailDefaults;
}) {
  return (
    <>
      <label className={styles.field}>
        Nama lengkap
        <input
          name="name"
          className={styles.input}
          defaultValue={defaults.name}
          required
          minLength={3}
          maxLength={NAME_MAX_LENGTH}
        />
      </label>
      <label className={styles.field}>
        Gelar
        <input
          name="title"
          className={styles.input}
          defaultValue={defaults.title ?? ""}
          placeholder="Misalnya S.E., M.Ak."
          maxLength={TITLE_MAX_LENGTH}
        />
      </label>
      <label className={styles.field}>
        NIP
        <input
          name="nip"
          className={styles.input}
          defaultValue={defaults.nip ?? ""}
          inputMode="numeric"
          maxLength={18}
        />
      </label>
      <label className={styles.field}>
        Email kedinasan
        <input
          name="email"
          type="email"
          className={styles.input}
          defaultValue={defaults.email ?? ""}
          placeholder="nama@pknstan.ac.id"
          required
        />
      </label>
    </>
  );
}
