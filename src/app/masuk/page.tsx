import { redirect } from "next/navigation";
import { currentSignIn } from "@/auth/current-account";
import { refusalMessage } from "@/auth/sign-in-messages";
import { SignInScreen } from "@/auth/sign-in-screen";
import { firstParam } from "@/ui/search-params";

export default async function SignInPage(props: PageProps<"/masuk">) {
  const signedIn = await currentSignIn();
  if (signedIn?.way === "google") redirect("/");
  const { pesan } = await props.searchParams;
  return <SignInScreen message={refusalMessage(firstParam(pesan))} />;
}
