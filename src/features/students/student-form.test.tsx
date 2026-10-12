import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { StudentForm } from "./student-form";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));
vi.mock("./actions", () => ({}));

test("the browser's own check is off, so the app's message is the one shown", () => {
  const form = renderToStaticMarkup(
    <StudentForm programs={[]} cohortYears={[]} editing={null} query="" />,
  );

  expect(/<form[^>]* novalidate=""/i.test(form)).toBe(true);
});
