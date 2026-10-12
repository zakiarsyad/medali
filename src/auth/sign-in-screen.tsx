import { BareScreen } from "@/ui/bare-screen";
import { SignInButton } from "./sign-in-button";
import styles from "./sign-in-screen.module.css";

export function SignInScreen() {
  return (
    <BareScreen>
      <h1 className={styles.name}>MEDALI</h1>
      <p className={styles.campus}>PKN STAN</p>
      <SignInButton />
    </BareScreen>
  );
}
