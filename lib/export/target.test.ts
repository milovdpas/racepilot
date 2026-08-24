import { describe, expect, it } from "vitest";
import {
  availableTargets,
  type ExportScope,
  targetFor,
} from "@/lib/export/target";
import type { Preferences, WatchBrand } from "@/lib/types";

const prefs = (watch?: WatchBrand): Preferences => ({ theme: "system", watch });
const ids = async (watch?: WatchBrand) =>
  (await availableTargets(prefs(watch))).map((t) => t.id);
const ids2 = async (watch: WatchBrand | undefined, scope: ExportScope | undefined) =>
  (await availableTargets(prefs(watch), scope)).map((t) => t.id);

describe("availableTargets", () => {
  it("offers everything to an athlete who has not been asked", () => {
    // undefined means never asked. Hiding a feature from someone who has told
    // us nothing is the mistake capabilitiesFor already refuses to make.
    return expect(ids(undefined)).resolves.toEqual(["fit-file", "ics-file"]);
  });

  it("offers a real workout file to the watches that read one", async () => {
    for (const watch of ["garmin", "coros", "wahoo", "apple"] as const) {
      expect(await ids(watch), watch).toEqual(["fit-file", "ics-file"]);
    }
  });

  it("offers Polar and Suunto the calendar only", async () => {
    // Neither accepts a third-party workout import, so a .fit would be a dead
    // end dressed up as a feature.
    for (const watch of ["polar", "suunto"] as const) {
      expect(await ids(watch), watch).toEqual(["ics-file"]);
    }
  });

  it('treats "other" and "none" as answers, not as silence', async () => {
    // Unlike undefined: these say a file will not help, so do not offer one.
    expect(await ids("other")).toEqual(["ics-file"]);
    expect(await ids("none")).toEqual(["ics-file"]);
  });

  it("puts the workout file first where it exists, since it is the better one", () => {
    return expect(ids("garmin")).resolves.toEqual(["fit-file", "ics-file"]);
  });
});

describe("targetFor", () => {
  it("returns the target for an id it knows", () => {
    expect(targetFor("fit-file")?.id).toBe("fit-file");
    expect(targetFor("ics-file")?.followUp).toBe("calendar");
  });

  it("returns undefined for one it does not, rather than throwing", () => {
    // "intervals" and "garmin" are declared in the type but not built yet, and
    // a caller asking for one should get a miss, not a crash.
    expect(targetFor("intervals")).toBeUndefined();
    expect(targetFor("garmin")).toBeUndefined();
  });
});

describe("follow-up instructions", () => {
  it("says a Garmin needs a cable, because Garmin Connect refuses the file", () => {
    expect(targetFor("fit-file")?.followUp).toBe("usb");
  });
});

describe("scope", () => {
  it("keeps the workout file and the calendar apart", () => {
    // They are different jobs: one session you take out on a run, versus the
    // whole block laid out over months.
    expect(targetFor("fit-file")?.scope).toBe("workout");
    expect(targetFor("ics-file")?.scope).toBe("plan");
  });

  it("offers only the file beside a single workout", async () => {
    // The calendar next to one session invites "which do I want?", and for one
    // workout the answer is always the file.
    expect(await ids2("garmin", "workout")).toEqual(["fit-file"]);
    expect(await ids2(undefined, "workout")).toEqual(["fit-file"]);
  });

  it("offers only the calendar at plan level", async () => {
    expect(await ids2("garmin", "plan")).toEqual(["ics-file"]);
  });

  it("gives a Polar owner no workout-scope target at all", async () => {
    // Which is what makes the send-to-watch button disappear rather than open
    // an empty dialog.
    expect(await ids2("polar", "workout")).toEqual([]);
    expect(await ids2("polar", "plan")).toEqual(["ics-file"]);
  });

  it("returns everything when no scope is asked for", async () => {
    expect(await ids2("garmin", undefined)).toEqual(["fit-file", "ics-file"]);
  });
});
