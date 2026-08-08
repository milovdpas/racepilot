import { describe, expect, it } from "vitest";
import type { OcrWord } from "@/lib/scanner/ocr";
import { hasSummary, parseSummary } from "@/lib/scanner/summary-scanner";

const H = 2000;

/** A word box. Height defaults to 40, width to ~22px per character. */
function w(text: string, x: number, y: number, width?: number): OcrWord {
  return {
    text,
    x0: x,
    x1: x + (width ?? text.length * 22),
    y0: y,
    y1: y + 40,
  };
}

/**
 * The layout of a real Strava activity screenshot, to scale: status bar, then
 * the header line with the start time, then the two-column stats grid.
 * Individual tests swap out the pieces they care about.
 */
function stravaRun(over: { value?: OcrWord[]; header?: OcrWord[] } = {}) {
  return [
    // Status bar. The phone's clock lives here and must never be mistaken for
    // the time the run started.
    w("00:04", 30, 40),
    ...(over.header ?? [
      w("Yesterday", 50, 330),
      w("at", 260, 330),
      w("9:17", 310, 330),
      w("PM", 420, 330),
      w("Oss,", 500, 330),
    ]),
    // Labels, which the parser must ignore entirely.
    w("Distance", 200, 530),
    w("Avg", 620, 530),
    w("Pace", 700, 530),
    ...(over.value ?? [
      w("16.34", 190, 570),
      w("km", 330, 570),
      w("5:03", 620, 570),
      w("/km", 730, 570),
    ]),
    w("Moving", 190, 640),
    w("Time", 300, 640),
    w("1:22:28", 190, 680),
    w("Elevation", 620, 640),
    w("Gain", 760, 640),
    w("8", 640, 680),
    w("m", 680, 680),
    w("Max", 400, 740),
    w("Elevation", 480, 740),
    w("11", 440, 780),
    w("m", 490, 780),
  ];
}

describe("parseSummary", () => {
  it("reads a Strava run screenshot", () => {
    const s = parseSummary(stravaRun(), H);
    expect(s.distanceKm).toBeCloseTo(16.34, 5);
    expect(s.paceSecPerKm).toBe(303);
    expect(s.durationMin).toBeCloseTo(82 + 28 / 60, 5);
    expect(s.startTime).toBe("21:17");
    expect(hasSummary(s)).toBe(true);
  });

  it("ignores the elevation rows, which are metres and not distance", () => {
    // "8 m" and "11 m" sit right there in the same grid; only km/mi anchor.
    expect(parseSummary(stravaRun(), H).distanceKm).toBeCloseTo(16.34, 5);
  });

  it("converts a miles screenshot to canonical km and sec/km", () => {
    const s = parseSummary(
      stravaRun({
        value: [
          w("10.15", 190, 570),
          w("mi", 330, 570),
          w("8:08", 620, 570),
          w("/mi", 730, 570),
        ],
      }),
      H,
    );
    expect(s.distanceKm).toBeCloseTo(16.335, 2);
    // 8:08 per mile is a shade over 5:03 per km.
    expect(s.paceSecPerKm).toBeCloseTo(303.2, 0);
  });

  it("accepts a comma decimal separator", () => {
    const s = parseSummary(
      stravaRun({ value: [w("16,34", 190, 570), w("km", 330, 570)] }),
      H,
    );
    expect(s.distanceKm).toBeCloseTo(16.34, 5);
  });

  it("accepts a value and its unit read as one word", () => {
    const s = parseSummary(
      stravaRun({ value: [w("16.34km", 190, 570), w("5:03/km", 620, 570)] }),
      H,
    );
    expect(s.distanceKm).toBeCloseTo(16.34, 5);
    expect(s.paceSecPerKm).toBe(303);
  });

  it("reads average speed when there is no pace, as on a ride", () => {
    const s = parseSummary(
      stravaRun({
        value: [
          w("40.2", 190, 570),
          w("km", 300, 570),
          w("28.5", 620, 570),
          w("km/h", 730, 570),
        ],
      }),
      H,
    );
    expect(s.distanceKm).toBeCloseTo(40.2, 5);
    // 28.5 km/h is 2:06 per km.
    expect(s.paceSecPerKm).toBeCloseTo(126.3, 1);
  });
});

describe("parseSummary: the start time", () => {
  it("folds a 12-hour clock into 24-hour", () => {
    const at = (time: string, mer: string) =>
      parseSummary(
        stravaRun({ header: [w(time, 310, 330), w(mer, 420, 330)] }),
        H,
      ).startTime;

    expect(at("9:17", "PM")).toBe("21:17");
    expect(at("9:17", "AM")).toBe("09:17");
    // Midnight and noon are the two everyone gets wrong.
    expect(at("12:30", "AM")).toBe("00:30");
    expect(at("12:30", "PM")).toBe("12:30");
    expect(at("12:30", "a.m.")).toBe("00:30");
  });

  it("takes a bare 24-hour time from the header", () => {
    const s = parseSummary(
      stravaRun({ header: [w("Gisteren", 50, 330), w("21:17", 310, 330)] }),
      H,
    );
    expect(s.startTime).toBe("21:17");
  });

  it("never returns the status-bar clock", () => {
    // A 24-hour locale with no header time at all: the only `h:mm` outside the
    // stats is the phone's own clock, and guessing it would be worse than
    // leaving the field for the user.
    const s = parseSummary(
      stravaRun({ header: [w("Gisteren", 50, 330)] }),
      H,
    );
    expect(s.startTime).toBeUndefined();
  });

  it("does not mistake the pace for a time of day", () => {
    // No header, so the only bare `h:mm` on the page is the pace itself.
    const words = stravaRun({ header: [] }).filter((x) => x.text !== "00:04");
    const s = parseSummary(words, H);
    expect(s.paceSecPerKm).toBe(303);
    expect(s.startTime).toBeUndefined();
  });

  it("will not guess from a bare time when nothing anchors the stats", () => {
    // A screenshot with no units found: there is no "above the stats" to test
    // against, so an unmarked `h:mm` stays unread.
    expect(parseSummary([w("7:45", 300, 400)], H).startTime).toBeUndefined();
    // The same time with a meridiem marker is unambiguous, and is taken.
    expect(
      parseSummary([w("7:45", 300, 400), w("PM", 420, 400)], H).startTime,
    ).toBe("19:45");
  });

  it("prefers a marked time over an unmarked one", () => {
    const s = parseSummary(
      stravaRun({
        header: [w("14:02", 50, 200), w("9:17", 310, 330), w("PM", 420, 330)],
      }),
      H,
    );
    expect(s.startTime).toBe("21:17");
  });
});

describe("parseSummary: rejection", () => {
  it("returns nothing for an image with no recognisable stats", () => {
    const s = parseSummary([w("Hello", 10, 100), w("world", 10, 200)], H);
    expect(s).toEqual({});
    expect(hasSummary(s)).toBe(false);
  });

  it("returns nothing for a splits table", () => {
    // The other screenshot the same button accepts: a column of paces with no
    // unit tokens anywhere. The splits parser handles it; this one must not
    // manufacture a total from it.
    const rows = [1, 2, 3, 4, 5].flatMap((i) => [
      w(String(i), 60, 200 + i * 80),
      w(`4:${40 + i}`, 300, 200 + i * 80),
    ]);
    const s = parseSummary(rows, H);
    expect(s.distanceKm).toBeUndefined();
    expect(s.paceSecPerKm).toBeUndefined();
  });

  it("rejects an implausible pace rather than logging it", () => {
    const s = parseSummary(
      stravaRun({ value: [w("0:42", 620, 570), w("/km", 730, 570)] }),
      H,
    );
    expect(s.paceSecPerKm).toBeUndefined();
  });

  it("rejects an implausible distance", () => {
    const s = parseSummary(
      stravaRun({ value: [w("0.01", 190, 570), w("km", 330, 570)] }),
      H,
    );
    expect(s.distanceKm).toBeUndefined();
  });

  it("needs the unit to be adjacent, not merely somewhere to the right", () => {
    // "16.34" here belongs to a different column than the stray "km".
    const s = parseSummary([w("16.34", 100, 500), w("km", 900, 500)], H);
    expect(s.distanceKm).toBeUndefined();
  });
});

describe("parseSummary: the duration", () => {
  it("takes moving time over elapsed time, by reading order", () => {
    const s = parseSummary(
      [
        ...stravaRun(),
        w("Elapsed", 620, 740),
        w("1:31:04", 620, 780),
      ],
      H,
    );
    expect(s.durationMin).toBeCloseTo(82 + 28 / 60, 5);
  });

  it("ignores a two-part time, which cannot be told from a pace", () => {
    const words = [w("42.2", 100, 500), w("km", 220, 500), w("3:30", 100, 600)];
    expect(parseSummary(words, H).durationMin).toBeUndefined();
  });
});
