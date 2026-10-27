import { redirect } from "next/navigation";
import { answerToNobody } from "@/auth/ask-to-sign-in";
import { currentAccount } from "@/auth/current-account";
import { SIGN_IN_PATH } from "@/auth/sign-in-messages";
import { currentStage } from "@/settings";
import { AddressNotFound } from "@/ui/address-not-found";
import { Notice } from "@/ui/notice";

// Without this file an unknown address inside the app would be answered
// outside the menu, by the page that also holds the sign-in page. Someone
// who is not signed in gets no menu here, so they get the card's words,
// or the sign-in page first, as outside the app.
export default async function NotFound() {
  const account = await currentAccount();
  if (account) {
    return (
      <Notice title="Halaman tidak ditemukan">
        Alamat ini tidak ada. Pilih halaman lain dari menu.
      </Notice>
    );
  }
  if (answerToNobody(currentStage()) === "sign-in") redirect(SIGN_IN_PATH);
  return <AddressNotFound />;
}
