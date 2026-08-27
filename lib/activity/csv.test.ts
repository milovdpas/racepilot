import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/activity/csv";

describe("parseCsv", () => {
  it("reads a plain grid", () => {
    expect(parseCsv("a,b\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("keeps commas inside quoted fields", () => {
    // The reason this file exists. Strava activity names really do contain
    // commas ("Intervalletje 6x 1km hard, 6x 0.5km rust"), and split(",")
    // shifts every column after one, producing plausible wrong numbers.
    expect(parseCsv('id,name,km\n7,"6x 1km hard, 6x 0.5km rust",9.01')).toEqual([
      ["id", "name", "km"],
      ["7", "6x 1km hard, 6x 0.5km rust", "9.01"],
    ]);
  });

  it("unescapes a doubled quote", () => {
    expect(parseCsv('a\n"he said ""hi"""')).toEqual([["a"], ['he said "hi"']]);
  });

  it("leaves a bare quote mid-field alone", () => {
    // Only a quote that *opens* a field is special, which is what lets 5'10"
    // through untouched.
    expect(parseCsv(`a\n5'10" tall`)).toEqual([["a"], [`5'10" tall`]]);
  });

  it("keeps newlines inside quoted fields", () => {
    expect(parseCsv('a,b\n"line1\nline2",x')).toEqual([
      ["a", "b"],
      ["line1\nline2", "x"],
    ]);
  });

  it("strips the BOM Strava writes", () => {
    // Otherwise the first header is "﻿Activity ID" and every lookup for
    // "Activity ID" silently misses.
    expect(parseCsv("﻿Activity ID,x\n1,2")[0][0]).toBe("Activity ID");
  });

  it("handles CRLF and a missing final newline", () => {
    expect(parseCsv("a,b\r\n1,2\r\n3,4")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("does not invent a trailing empty row", () => {
    expect(parseCsv("a,b\n1,2\n")).toHaveLength(2);
  });

  it("preserves empty cells, which carry meaning here", () => {
    // Heart rate is blank in every row of a real export; a dropped cell would
    // shift the columns after it.
    expect(parseCsv("a,b,c\n1,,3")).toEqual([
      ["a", "b", "c"],
      ["1", "", "3"],
    ]);
  });
});
