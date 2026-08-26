import { describe, expect, it } from "vitest";
import { capabilitiesFor, markForAthlete, showsSport } from "./athlete";

describe("capabilitiesFor", () => {
  it("shows everything when the user has never been asked", () => {
    const caps = capabilitiesFor(undefined);
    expect(caps.ultraFormats).toBe(true);
    expect(caps.multiSport).toBe(true);
    expect([...caps.sports].sort()).toEqual(["bike", "run", "swim"]);
  });

  it("shows everything when the user declined to answer", () => {
    // `[]` means "asked and declined" — a different thing from `undefined` to
    // the prompt, but the same thing to the UI.
    expect(capabilitiesFor([])).toBe(capabilitiesFor(undefined));
  });

  it("gives a plain runner only running, and no ultra formats", () => {
    const caps = capabilitiesFor(["runner"]);
    expect([...caps.sports]).toEqual(["run"]);
    expect(caps.ultraFormats).toBe(false);
    expect(caps.multiSport).toBe(false);
    expect(caps.trail).toBe(false);
  });

  it("unlocks ultra formats for ultra and trail runners", () => {
    expect(capabilitiesFor(["ultra"]).ultraFormats).toBe(true);
    expect(capabilitiesFor(["trail"]).ultraFormats).toBe(true);
    expect(capabilitiesFor(["trail"]).trail).toBe(true);
    expect(capabilitiesFor(["ultra"]).trail).toBe(false);
  });

  it("gives a triathlete all three sports", () => {
    const caps = capabilitiesFor(["triathlete"]);
    expect([...caps.sports].sort()).toEqual(["bike", "run", "swim"]);
    expect(caps.multiSport).toBe(true);
  });

  it("unions the sports of every selected type", () => {
    const caps = capabilitiesFor(["cyclist", "swimmer"]);
    expect([...caps.sports].sort()).toEqual(["bike", "swim"]);
    expect(showsSport(caps, "run")).toBe(false);
    expect(showsSport(caps, "bike")).toBe(true);
  });

  it("takes the primary from the order the user picked", () => {
    expect(capabilitiesFor(["cyclist", "runner"]).primary).toBe("cyclist");
    expect(capabilitiesFor(["runner", "cyclist"]).primary).toBe("runner");
  });

  it("returns a stable object so consumers don't re-render", () => {
    expect(capabilitiesFor(["runner", "cyclist"])).toBe(
      capabilitiesFor(["runner", "cyclist"]),
    );
  });

  it("does not conflate two selections that differ only in order", () => {
    // They carry different `primary` values, so caching them under one key
    // would hand the second caller the first caller's answer.
    expect(capabilitiesFor(["runner", "cyclist"])).not.toBe(
      capabilitiesFor(["cyclist", "runner"]),
    );
  });
});

describe("markForAthlete", () => {
  it("gives a single-sport athlete their own sport", () => {
    expect(markForAthlete(["runner"])).toBe("run");
    expect(markForAthlete(["cyclist"])).toBe("bike");
    expect(markForAthlete(["swimmer"])).toBe("swim");
  });

  it("keeps every running type on the running mark", () => {
    // Trail and ultra are the same sport as road running, so this is one sport
    // however many of them are picked.
    expect(markForAthlete(["runner", "trail", "ultra"])).toBe("run");
    expect(markForAthlete(["ultra"])).toBe("run");
  });

  it("gives the multi mark to anyone doing more than one sport", () => {
    // The bug this replaces: a triathlete's badge rendered three emoji
    // squeezed into a 32px box.
    expect(markForAthlete(["triathlete"])).toBe("multi");
    expect(markForAthlete(["swimmer", "cyclist"])).toBe("multi");
    expect(markForAthlete(["runner", "swimmer"])).toBe("multi");
  });

  it("reads the sports, not the order they were picked", () => {
    // Whichever they tapped first is not the point: two sports is what is true
    // about them, and the badge should not claim something narrower.
    expect(markForAthlete(["swimmer", "cyclist"])).toBe(
      markForAthlete(["cyclist", "swimmer"]),
    );
  });

  it("falls back to running when the athlete has said nothing", () => {
    // Not "multi". Someone who never answered gets ALL capabilities internally,
    // so counting their sports would put the multi-sport mark on a person who
    // has told us nothing at all.
    expect(markForAthlete(undefined)).toBe("run");
    expect(markForAthlete([])).toBe("run");
  });
});
