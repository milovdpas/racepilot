import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every `t("…")` in the app resolves to a key that exists.
 *
 * `Dict` already makes a key present in `en.ts` and missing from `nl.ts` a
 * compile error, but nothing checks the other direction: `t()` takes a plain
 * string, so a typo or a key that was never added renders as **the key itself**
 * and ships. That is how `common.copied` reached production in the debug panel,
 * where the button read "common.copied" until someone happened to look at it.
 *
 * Source is scanned rather than imported, because the check is about what the
 * components ask for and only the call sites know that.
 */
function definedKeys(): Set<string> {
  const src = readFileSync("lib/i18n/locales/en.ts", "utf8");
  const keys = new Set<string>();
  let stack: string[] = [];

  for (const line of src.split("\n")) {
    const open = /^(\s+)(?:([A-Za-z_][\w-]*)|"([^"]+)"): \{/.exec(line);
    if (open) {
      stack = stack.slice(0, open[1].length / 2 - 1);
      stack.push(open[2] ?? open[3]);
      continue;
    }
    const leaf = /^(\s+)(?:([A-Za-z_][\w-]*)|"([^"]+)"):/.exec(line);
    if (leaf) {
      const depth = leaf[1].length / 2 - 1;
      keys.add([...stack.slice(0, depth), leaf[2] ?? leaf[3]].join("."));
    }
    const close = /^(\s*)\},?$/.exec(line);
    if (close) stack = stack.slice(0, close[1].length / 2 - 1);
  }
  return keys;
}

/** Every .ts/.tsx source file under a root, tests excluded. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [path]
      : [];
  });
}

function usedKeys(): string[] {
  // A plain walk rather than shelling out to grep: this has to run wherever
  // `npm test` runs, and grep is not on PATH on Windows.
  const found = new Set<string>();
  for (const root of ["components", "hooks", "app", "lib"]) {
    for (const file of sourceFiles(root)) {
      const src = readFileSync(file, "utf8");
      for (const m of src.matchAll(/\bt\("([a-zA-Z][\w.-]+)"/g)) {
        found.add(m[1]);
      }
    }
  }
  return [...found];
}

describe("translation keys", () => {
  it("every key the app asks for is defined", () => {
    const defined = definedKeys();
    const missing = usedKeys().filter(
      (key) =>
        // Plurals live under `_one` / `_other`; i18next resolves the base name.
        !defined.has(key) &&
        !defined.has(`${key}_one`) &&
        !defined.has(`${key}_other`),
    );
    expect(missing).toEqual([]);
  });

  it("finds the keys it is supposed to find, so an empty pass means something", () => {
    // Guards the guard. If either scanner silently matched nothing, the test
    // above would pass while checking precisely nothing.
    const defined = definedKeys();
    expect(defined.size).toBeGreaterThan(300);
    expect(defined.has("common.save")).toBe(true);
    expect(defined.has("settings.copied")).toBe(true);
    expect(usedKeys().length).toBeGreaterThan(200);
  });
});
