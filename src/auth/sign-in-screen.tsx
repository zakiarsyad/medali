import { BareScreen } from "@/ui/bare-screen";
import shared from "@/ui/data-screen.module.css";
import { PRIVACY_PATH } from "./privacy-screen";
import { SignInButton } from "./sign-in-button";
import styles from "./sign-in-screen.module.css";

/** `message` says why the last sign-in was refused, when one was. */
export function SignInScreen({ message }: { message: string | null }) {
  return (
    <BareScreen>
      <h1 className={styles.name}>MEDALI</h1>
      <p className={styles.campus}>PKN STAN</p>
      <SignInButton message={message} />
      <p className={styles.privacy}>
        <a href={PRIVACY_PATH} className={shared.link}>
          Kebijakan privasi
        </a>
      </p>
    </BareScreen>
  );
}
