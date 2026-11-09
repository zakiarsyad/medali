import shared from "@/ui/data-screen.module.css";
import { MedaliLogo } from "@/ui/medali-logo";
import { PRIVACY_PATH } from "./privacy-screen";
import { SignInButton } from "./sign-in-button";
import styles from "./sign-in-screen.module.css";

/** The values as the sign-in page words them, each with its MEDALI letter. */
const VALUE_WORDS = [
  { word: "Mandiri", letter: "M" },
  { word: "Empatik", letter: "E" },
  { word: "Disiplin", letter: "D" },
  { word: "Adaptif", letter: "A" },
  { word: "Loyal", letter: "L" },
  { word: "berIntegritas", letter: "I" },
] as const;

function ValueWord({ word, letter }: { word: string; letter: string }) {
  const at = word.indexOf(letter);
  return (
    <li>
      {word.slice(0, at)}
      <b className={styles.letter}>{letter}</b>
      {word.slice(at + letter.length)}
    </li>
  );
}

/** `message` says why the last sign-in was refused, when one was. */
export function SignInScreen({ message }: { message: string | null }) {
  return (
    <main className={styles.screen}>
      <div className={styles.box}>
        <MedaliLogo />
        <h1 className={styles.name}>MEDALI</h1>
        <p className={styles.campus}>PKN STAN</p>
        <p className={styles.tagline}>Membangun Karakter, Meraih MEDALI</p>
        <ul className={styles.values} aria-label="Nilai MEDALI">
          {VALUE_WORDS.map((value) => (
            <ValueWord key={value.word} {...value} />
          ))}
        </ul>
        <SignInButton message={message} />
        <p className={styles.privacy}>
          <a href={PRIVACY_PATH} className={shared.link}>
            Kebijakan privasi
          </a>
        </p>
      </div>
    </main>
  );
}
