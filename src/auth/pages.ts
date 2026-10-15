/**
 * Every page of the app, in menu order. `path` is the address shown in the
 * browser; `title` is what the menu shows.
 */
export const PAGES = [
  { id: "profile", path: "saya", title: "Profil saya" },
  { id: "tasks", path: "tugas", title: "Tugas saya" },
  { id: "dashboard", path: "dashboard", title: "Dashboard" },
  { id: "curriculum", path: "kurikulum", title: "Kurikulum" },
  {
    id: "activities",
    path: "kegiatan",
    title: "Kegiatan karakter",
    tabs: [
      { id: "verification", path: "verifikasi", title: "Verifikasi presensi" },
      {
        id: "clarification",
        path: "klarifikasi",
        title: "Klarifikasi kehadiran",
      },
      { id: "ppks", path: "ppks", title: "Kegiatan PPKS" },
      { id: "extra", path: "tambahan", title: "Kegiatan tambahan" },
    ],
  },
  { id: "students", path: "mahasiswa", title: "Mahasiswa" },
  {
    id: "mentors",
    path: "pengasuh",
    title: "Pengasuh",
    tabs: [
      { id: "groups", path: "kelompok", title: "Kelompok pengasuhan" },
      { id: "mentors", path: "daftar", title: "Pengasuh" },
      {
        id: "student_survey",
        path: "survei",
        title: "Evaluasi oleh mahasiswa",
      },
      { id: "replacement", path: "ganti", title: "Evaluasi dan penggantian" },
      { id: "new_cohort", path: "tetap", title: "Penetapan angkatan baru" },
    ],
  },
  {
    id: "mentoring",
    path: "pengasuhan",
    title: "Pengasuhan",
    tabs: [
      { id: "notes", path: "catatan", title: "Catatan pendampingan" },
      { id: "meetings", path: "hadir", title: "Pertemuan dan daftar hadir" },
      { id: "scores", path: "nilai", title: "Nilai pengasuhan" },
    ],
  },
  {
    id: "assessment",
    path: "penilaian",
    title: "Penilaian",
    tabs: [
      { id: "character", path: "karakter", title: "Penilaian karakter" },
      { id: "character_test", path: "asesmen", title: "Asesmen karakter" },
      { id: "fitness", path: "jasmani", title: "Penilaian jasmani" },
      { id: "mental_health", path: "mental", title: "Kesehatan mental" },
      { id: "skpm", path: "skpm", title: "Data SKPM" },
      { id: "siku", path: "siku", title: "Penilaian SIKU" },
    ],
  },
  { id: "counselling", path: "konseling", title: "Konseling" },
  {
    id: "guidance",
    path: "pembinaan",
    title: "Pembinaan",
    tabs: [
      { id: "character", path: "karakter", title: "Pembinaan karakter" },
      { id: "discipline", path: "disiplin", title: "Pelanggaran disiplin" },
      { id: "violation_notes", path: "catatan", title: "Catatan pelanggaran" },
    ],
  },
  {
    id: "dorm",
    path: "asrama",
    title: "Asrama",
    tabs: [
      { id: "overview", path: "dash", title: "Dashboard asrama" },
      { id: "activities", path: "kegiatan", title: "Kegiatan asrama" },
      { id: "leave", path: "izin", title: "Perizinan asrama" },
      { id: "clarification", path: "klar", title: "Klarifikasi kehadiran" },
      { id: "rooms", path: "kamar", title: "Ploting kamar" },
      { id: "companions", path: "kakak", title: "Kakak pendamping" },
      { id: "cleaning", path: "bersih", title: "Pembersihan asrama" },
      { id: "violations", path: "pel", title: "Pelanggaran" },
      { id: "health", path: "sehat", title: "Kesehatan" },
    ],
  },
  {
    id: "settings",
    path: "pengaturan",
    title: "Pengaturan",
    tabs: [
      { id: "users", path: "pengguna", title: "Pengguna dan peran" },
      {
        id: "new_students",
        path: "mahasiswa",
        title: "Pengguna baru mahasiswa",
      },
      { id: "academic_periods", path: "periode", title: "Periode akademik" },
      { id: "proof_files", path: "berkas", title: "Berkas bukti" },
    ],
  },
] as const satisfies readonly PageDefinition[];

export interface TabDefinition {
  id: string;
  path: string;
  title: string;
}

export interface PageDefinition {
  id: string;
  path: string;
  title: string;
  tabs?: readonly TabDefinition[];
}

export type Page = (typeof PAGES)[number];
export type PageId = Page["id"];
type PageWithTabs = Extract<Page, { tabs: readonly TabDefinition[] }>;
export type TabbedPageId = PageWithTabs["id"];
export type TabId<P extends TabbedPageId> = Extract<
  PageWithTabs,
  { id: P }
>["tabs"][number]["id"];

export function pageAt(path: string): Page | undefined {
  return PAGES.find((page) => page.path === path);
}
