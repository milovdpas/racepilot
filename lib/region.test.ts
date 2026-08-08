import { afterEach, describe, expect, it, vi } from "vitest";
import {
  countryName,
  countrySource,
  detectCountry,
  unitsForCountry,
} from "./region";

function stubNavigator(languages: string[], timeZone?: string) {
  vi.stubGlobal("navigator", { languages, language: languages[0] });
  if (timeZone) {
    vi.spyOn(Intl, "DateTimeFormat").mockReturnValue({
      resolvedOptions: () => ({ timeZone }),
    } as unknown as Intl.DateTimeFormat);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("unitsForCountry", () => {
  it("gives the US miles", () => {
    expect(unitsForCountry("US")).toBe("imperial");
    expect(unitsForCountry("us")).toBe("imperial");
  });

  it("gives everywhere else kilometers", () => {
    expect(unitsForCountry("NL")).toBe("metric");
    expect(unitsForCountry("DE")).toBe("metric");
    expect(unitsForCountry("AU")).toBe("metric");
  });

  it("gives the UK kilometers, deliberately", () => {
    // Road signs are in miles, but British distance runners train in km.
    // Overridable in Settings either way.
    expect(unitsForCountry("GB")).toBe("metric");
  });

  it("defaults to metric when the country is unknown", () => {
    expect(unitsForCountry(undefined)).toBe("metric");
    expect(unitsForCountry("")).toBe("metric");
  });
});

describe("detectCountry", () => {
  it("prefers the timezone over the locale's region", () => {
    // The bug that prompted the order: a Dutch athlete whose phone runs in
    // "English (United States)" is not American, and was being shown miles.
    stubNavigator(["en-US", "en"], "Europe/Amsterdam");
    expect(detectCountry()).toBe("NL");
    expect(countrySource()).toBe("timezone");
  });

  it("agrees with the locale when they agree", () => {
    stubNavigator(["nl-NL"], "Europe/Amsterdam");
    expect(detectCountry()).toBe("NL");
  });

  it("reads the timezone across continents", () => {
    const at = (tz: string) => {
      stubNavigator(["en"], tz);
      return detectCountry();
    };
    expect(at("America/Denver")).toBe("US");
    expect(at("America/Indiana/Indianapolis")).toBe("US");
    expect(at("Pacific/Honolulu")).toBe("US");
    expect(at("America/Toronto")).toBe("CA");
    expect(at("Europe/London")).toBe("GB");
    expect(at("Australia/Sydney")).toBe("AU");
    expect(at("Asia/Kolkata")).toBe("IN");
    expect(at("Africa/Nairobi")).toBe("KE");
    expect(at("America/Sao_Paulo")).toBe("BR");
    expect(at("Asia/Tokyo")).toBe("JP");
  });

  it("still knows the old spelling of a renamed zone", () => {
    // Devices report whatever tzdata their OS shipped with.
    stubNavigator(["en"], "Europe/Kiev");
    expect(detectCountry()).toBe("UA");
    stubNavigator(["en"], "Asia/Calcutta");
    expect(detectCountry()).toBe("IN");
  });

  it("falls back to the locale for a zone it does not know", () => {
    stubNavigator(["nl-NL"], "Antarctica/Troll");
    expect(detectCountry()).toBe("NL");
    expect(countrySource()).toBe("locale");
  });

  it("finds the region even when it isn't the second part", () => {
    stubNavigator(["zh-Hant-TW"], "Antarctica/Troll");
    expect(detectCountry()).toBe("TW");
  });

  it("skips a language with no region and takes the next one", () => {
    stubNavigator(["en", "en-GB"], "Antarctica/Troll");
    expect(detectCountry()).toBe("GB");
  });

  it("returns undefined rather than guessing", () => {
    // Undefined is a good answer: it means metric, right for most of the world.
    stubNavigator(["en"], "Antarctica/Troll");
    expect(detectCountry()).toBeUndefined();
    expect(countrySource()).toBe("none");
  });

  it("is safe on the server, where there is no navigator", () => {
    vi.stubGlobal("navigator", undefined);
    expect(detectCountry()).toBeUndefined();
  });
});

describe("countryName", () => {
  it("resolves a code to a readable name", () => {
    expect(countryName("NL", "en")).toBe("Netherlands");
    expect(countryName("US", "en")).toBe("United States");
  });

  it("falls back to the code when Intl rejects it", () => {
    // A structurally invalid code throws a RangeError. Note "ZZ" does NOT: it
    // is CLDR's reserved "unknown region" and resolves to a real name, so the
    // fallback is for malformed input and Intl-less runtimes only.
    expect(countryName("!", "en")).toBe("!");
  });
});
