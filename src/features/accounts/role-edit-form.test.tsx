import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import type { ManagedAccount } from "./manage-accounts";
import { RoleEditForm } from "./role-edit-form";

vi.mock("./actions", () => ({ changeRolesAction: vi.fn() }));

const account: ManagedAccount = {
  id: "6f1c1f8e-3b7a-4c55-9a51-2f7d3c8b9e10",
  name: "Budi Contoh",
  title: null,
  nip: null,
  email: null,
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
