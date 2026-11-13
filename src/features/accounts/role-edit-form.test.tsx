import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import type { ManagedAccount } from "./manage-accounts";
import { RoleEditForm } from "./role-edit-form";

vi.mock("./actions", () => ({ changeRolesAction: vi.fn() }));

const account: ManagedAccount = {
  id: "6f1c1f8e-3b7a-4c55-9a51-2f7d3c8b9e10",
  name: "Budi Contoh",
  title: "S.E.",
  nip: "198001012005011001",
  email: "budi.contoh@contoh.ac.id",
  unit: "Unit Pembangunan Karakter",
  roles: ["mentor"],
  studyProgramId: null,
  studyProgram: null,
};

test("the box of the unit takes no more than its longest length", () => {
  const form = renderToStaticMarkup(
    <RoleEditForm account={account} programs={[]} back="/" />,
  );
  const box = form.match(/<input[^>]* name="unit"[^>]*>/)?.[0];

  expect(box).toContain('maxLength="100"');
});

test("shows the name, title, NIP and email filled in, saved by Simpan", () => {
  const form = renderToStaticMarkup(
    <RoleEditForm account={account} programs={[]} back="/" />,
  );
  const boxOf = (name: string) =>
    form.match(new RegExp(`<input[^>]* name="${name}"[^>]*>`))?.[0];

  expect(boxOf("name")).toContain('value="Budi Contoh"');
  expect(boxOf("title")).toContain('value="S.E."');
  expect(boxOf("nip")).toContain('value="198001012005011001"');
  expect(boxOf("email")).toContain('value="budi.contoh@contoh.ac.id"');
  expect(form).toContain(">Simpan</button>");
  expect(boxOf("email")).not.toContain("readOnly");
});

test("locks the email on the manager's own account, with a note why", () => {
  const form = renderToStaticMarkup(
    <RoleEditForm account={account} programs={[]} back="/" isOwn />,
  );
  const box = form.match(/<input[^>]* name="email"[^>]*>/)?.[0];

  expect(box).toContain("readOnly");
  expect(box).toContain('value="budi.contoh@contoh.ac.id"');
  expect(form).toContain("Email Anda sendiri tidak bisa diubah di sini.");
  expect(form).not.toMatch(/<input[^>]* name="name"[^>]*readOnly/);
});
