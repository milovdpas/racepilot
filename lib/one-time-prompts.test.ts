import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Every one-time prompt in the gate has a key in `ONE_TIME_PROMPT_KEYS`.
 *
 * The debug panel's "ask again" button clears that list. When it kept its own
 * copy, adding a fifth prompt silently left it resetting only four — the worst
 * kind of broken for a testing aid, because it still looks like it worked. The
 * list is now the single source, and this makes forgetting to extend it a
 * failing test rather than a confusing afternoon.
 */
describe("one-time prompts", () => {
  const src = readFileSync("components/common/whats-new-gate.tsx", "utf8");

  const declared = (() => {
    const block = /ONE_TIME_PROMPT_KEYS = \[([\s\S]*?)\]/.exec(src)?.[1] ?? "";
    return [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  })();

  /** Which preference each step writes when it is skipped. */
  const stepKeys = (() => {
    const keys = new Set<string>();
    for (const m of src.matchAll(/onSkip=\{\(\) => \{\s*setPreferences\(\{([^}]*)\}/g)) {
      for (const k of m[1].matchAll(/(\w+):/g)) keys.add(k[1]);
    }
    return [...keys];
  })();

  it("finds the list and the steps, so a pass is not vacuous", () => {
    expect(declared.length).toBeGreaterThanOrEqual(4);
    expect(stepKeys.length).toBeGreaterThanOrEqual(3);
  });

  it("resets every flag a step writes", () => {
    const missing = stepKeys.filter((key) => !declared.includes(key));
    expect(missing).toEqual([]);
  });
});
