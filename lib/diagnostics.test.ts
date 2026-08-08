import { describe, expect, it } from "vitest";
import {
  diagnosticsText,
  formatBytes,
  registerTap,
  shown,
  TAP_WINDOW_MS,
  TAPS_NEEDED,
} from "./diagnostics";

describe("registerTap", () => {
  /** Tap `n` times, `gap` ms apart, from `start`. Returns the last result. */
  function run(n: number, gap: number, start = 0) {
    let taps: number[] = [];
    let last = registerTap(taps, start);
    taps = last.taps;
    for (let i = 1; i < n; i++) {
      last = registerTap(taps, start + i * gap);
      taps = last.taps;
    }
    return last;
  }

  it("unlocks on the tenth fast tap, not the ninth", () => {
    expect(run(TAPS_NEEDED - 1, 100).unlocked).toBe(false);
    expect(run(TAPS_NEEDED, 100).unlocked).toBe(true);
  });

  it("counts down so the UI can hint", () => {
    expect(registerTap([], 0).remaining).toBe(TAPS_NEEDED - 1);
    expect(run(8, 100).remaining).toBe(2);
  });

  it("forgets taps that fall out of the window", () => {
    // Nine quick taps, then a long pause: the run is gone and one more tap
    // starts over rather than sneaking in as the tenth.
    let taps: number[] = [];
    for (let i = 0; i < 9; i++) taps = registerTap(taps, i * 100).taps;
    const late = registerTap(taps, 100 * 8 + TAP_WINDOW_MS + 1);
    expect(late.unlocked).toBe(false);
    expect(late.taps).toHaveLength(1);
  });

  it("tolerates a slow start, because the window rolls", () => {
    // Ten steady taps 250ms apart span 2.25s of a 3s window, so they land even
    // though the run takes most of it. A window anchored to the first tap and
    // reset on expiry would be far less forgiving.
    expect(run(TAPS_NEEDED, 250).unlocked).toBe(true);
  });

  it("clears its history on unlock, so the next run starts fresh", () => {
    expect(run(TAPS_NEEDED, 100).taps).toEqual([]);
  });
});

describe("shown", () => {
  it("never lets an absent value read as a real one", () => {
    expect(shown(undefined)).toBe("not set");
    expect(shown(null)).toBe("not set");
    expect(shown("")).toBe("not set");
    expect(shown([])).toBe("empty");
  });

  it("renders the values that are there", () => {
    expect(shown("NL")).toBe("NL");
    expect(shown(0)).toBe("0");
    expect(shown(false)).toBe("no");
    expect(shown(true)).toBe("yes");
    expect(shown(["en-GB", "nl"])).toBe("en-GB, nl");
  });
});

describe("diagnosticsText", () => {
  it("renders sections as pasteable text", () => {
    expect(
      diagnosticsText([
        { title: "Region", rows: [{ label: "Country", value: "NL" }] },
        { title: "Store", rows: [{ label: "Plans", value: "2" }] },
      ]),
    ).toBe("## Region\n- Country: NL\n\n## Store\n- Plans: 2");
  });
});

describe("formatBytes", () => {
  it("scales the unit", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
  });
});
