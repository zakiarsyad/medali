import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { AddAccountForm } from "./add-account-form";

vi.mock("./actions", () => ({ addAccountAction: vi.fn() }));

test("the browser's own check is off, so the app's message is the one shown", () => {
  const form = renderToStaticMarkup(<AddAccountForm programs={[]} />);

  expect(/<form[^>]* novalidate=""/i.test(form)).toBe(true);
});

test.each([
  ["name", 100],
  ["title", 50],
  ["unit", 100],
])("the box %s takes no more than its longest length", (name, longest) => {
  const form = renderToStaticMarkup(<AddAccountForm programs={[]} />);
  const box = form.match(new RegExp(`<input[^>]* name="${name}"[^>]*>`))?.[0];

  expect(box).toContain(`maxLength="${longest}"`);
});
