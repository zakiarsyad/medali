import { TabNote } from "@/ui/tabbed-head";

/** The line that tells a role which only reads who fills Pengasuhan in. */
export function ReadOnlyLine() {
  return (
    <TabNote>
      Catatan pendampingan, daftar hadir pertemuan, dan nilai pengasuhan hanya
      diisi oleh pengasuh untuk anak asuhnya. Anda dapat melihat isian yang
      sudah dibuat pengasuh.
    </TabNote>
  );
}
