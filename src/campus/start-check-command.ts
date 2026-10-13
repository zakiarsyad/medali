import { startRefusals } from "./start-check";

/**
 * Stops the campus server package before anything of it starts, and says
 * why. It ends with an error, so the package stops instead of serving.
 */
function checkStart(): void {
  const refusals = startRefusals(process.env);
  if (refusals.length === 0) {
    console.log("The settings of the campus server package are in order.");
    return;
  }
  for (const refusal of refusals) console.error(refusal);
  process.exitCode = 1;
}

checkStart();
