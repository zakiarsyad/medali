import { redirect } from "next/navigation";
import { currentSignIn } from "@/auth/current-account";
import { SignInScreen } from "@/auth/sign-in-screen";

export default async function SignInPage() {
  const signedIn = await currentSignIn();
  if (signedIn?.way === "google") redirect("/");
  return <SignInScreen />;
}
