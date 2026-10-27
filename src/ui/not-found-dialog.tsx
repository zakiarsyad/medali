import shared from "./data-screen.module.css";
import { ModalDialog } from "./modal-dialog";

/** What an address can name over a page that is then not found. */
export type NamedThing = "student" | "group";

const WORDS: Record<NamedThing, { title: string; data: string }> = {
  student: { title: "Mahasiswa tidak ditemukan", data: "Data mahasiswa ini" },
  group: { title: "Kelompok tidak ditemukan", data: "Data kelompok ini" },
};

/**
 * The window over a page whose address names a record that is not found.
 * A record the account may not see gets it too, so the two look the same.
 */
export function NotFoundDialog({
  thing,
  returnPlace,
  closeAddress,
}: {
  thing: NamedThing;
  /** The place Tutup returns to, as the words name it. */
  returnPlace: string;
  /** The address of the page without the window. */
  closeAddress: string;
}) {
  const words = WORDS[thing];
  return (
    <ModalDialog label={words.title} closeAddress={closeAddress}>
      <h2 className={shared.heading}>{words.title}</h2>
      <p>
        {words.data} tidak ada atau tidak dapat Anda lihat. Pilih Tutup untuk
        kembali ke {returnPlace}.
      </p>
    </ModalDialog>
  );
}
