import { describe, expect, it } from "vitest";
import { isFlagEnabled } from "./site";

describe("isFlagEnabled", () => {
  it("is on for the values a deployment would write", () => {
    expect(isFlagEnabled("1")).toBe(true);
    expect(isFlagEnabled("true")).toBe(true);
    expect(isFlagEnabled("TRUE")).toBe(true);
    expect(isFlagEnabled(" 1 ")).toBe(true);
  });

  // The reason this helper exists rather than a bare truthiness check: the
  // string "0" is truthy in JavaScript, so `Boolean(env.FLAG)` would read
  // FLAG=0 as enabled. That is the exact opposite of what it means.
  it('is off for "0", which a truthiness check would get backwards', () => {
    expect(isFlagEnabled("0")).toBe(false);
    expect(isFlagEnabled("false")).toBe(false);
  });

  it("is off when absent or empty", () => {
    expect(isFlagEnabled(undefined)).toBe(false);
    expect(isFlagEnabled("")).toBe(false);
    expect(isFlagEnabled("   ")).toBe(false);
  });

  it("is off for anything it does not recognise, rather than guessing", () => {
    expect(isFlagEnabled("yes")).toBe(false);
    expect(isFlagEnabled("enabled")).toBe(false);
    expect(isFlagEnabled("2")).toBe(false);
  });
});
