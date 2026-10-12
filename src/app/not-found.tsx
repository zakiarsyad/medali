import { redirect } from "next/navigation";
import { answerToNobody } from "@/auth/ask-to-sign-in";
import { currentAccount } from "@/auth/current-account";
import { SIGN_IN_PATH } from "@/auth/sign-in-messages";
import { currentStage } from "@/settings";
import { BareScreen } from "@/ui/bare-screen";
import styles from "@/ui/data-screen.module.css";
import { Notice } from "@/ui/notice";

/**
 * Answers an address that no page of the app has, such as one with more
 * parts than a page and a tab. Someone who is not signed in is sent to
 * the sign-in page first, and so learns nothing of which addresses exist.
 */
export default async function NotFound() {
  const account = await currentAccount();
  if (!account && answerToNobody(currentStage()) === "sign-in") {
    redirect(SIGN_IN_PATH);
  }
  return (
    <BareScreen>
      <Notice title="Halaman tidak ditemukan">
        Alamat ini tidak ada.{" "}
        <a href="/" className={styles.link}>
          Kembali ke halaman utama.
        </a>
      </Notice>
    </BareScreen>
  );
}
