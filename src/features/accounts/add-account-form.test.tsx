import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { AddAccountForm } from "./add-account-form";

vi.mock("./actions", () => ({ addAccountAction: vi.fn() }));

test("the browser's own check is off, so the app's message is the one shown", () => {
  const form = renderToStaticMarkup(<AddAccountForm programs={[]} />);

  expect(/<form[^>]* novalidate=""/i.test(form)).toBe(true);
});
