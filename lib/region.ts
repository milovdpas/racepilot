// Where the athlete is, inferred from the browser and nothing else.
//
// **Never IP geolocation, and never the weather feature's device location.**
// The first screen of onboarding promises that nothing about you is sent
// anywhere, and both of those would break that promise to answer a question
// worth a default unit setting. The timezone and `navigator.language` are
// already in every request header the browser sends, or derivable from one;
// reading them locally reveals nothing new.
//
// The answer is a *default*, not a fact. It is wrong for anyone who travels or
// simply prefers the other system, which is why it is always overridable in
// Settings.

import type { UnitSystem } from "@/lib/units";

/**
 * The countries that use miles for road distance. Everywhere else is metric.
 *
 * The UK is the interesting one and is deliberately **metric** here: road signs
 * are in miles, but British distance runners train and race in kilometers
 * (parkrun is 5K, track is metric, and race distances are quoted in km). A UK
 * user who disagrees flips one switch; a UK user shown miles for every interval
 * session has to fight the app.
 */
const IMPERIAL_COUNTRIES = new Set(["US", "LR", "MM"]);

/** ISO 3166-1 alpha-2 -> the unit system to default to. */
export function unitsForCountry(country?: string): UnitSystem {
  if (!country) return "metric";
  return IMPERIAL_COUNTRIES.has(country.toUpperCase()) ? "imperial" : "metric";
}

/**
 * IANA timezones by country, listing the zones a browser actually reports.
 *
 * Written this way round because it is far easier to keep honest: the entry
 * for a country is one line you can check against a map. It is inverted once,
 * lazily, into the lookup the code needs.
 *
 * Not exhaustive over all ~600 zones. Deliberately: every zone here is one a
 * consumer device is plausibly set to, and an unlisted zone falls back to the
 * locale rather than to a wrong answer.
 */
const ZONES_BY_COUNTRY: Record<string, string[]> = {
  // --- Europe
  AL: ["Europe/Tirane"],
  AD: ["Europe/Andorra"],
  AT: ["Europe/Vienna"],
  AX: ["Europe/Mariehamn"],
  BA: ["Europe/Sarajevo"],
  BE: ["Europe/Brussels"],
  BG: ["Europe/Sofia"],
  BY: ["Europe/Minsk"],
  CH: ["Europe/Zurich"],
  CY: ["Asia/Nicosia", "Asia/Famagusta"],
  CZ: ["Europe/Prague"],
  DE: ["Europe/Berlin", "Europe/Busingen"],
  DK: ["Europe/Copenhagen"],
  EE: ["Europe/Tallinn"],
  ES: ["Europe/Madrid", "Africa/Ceuta", "Atlantic/Canary"],
  FI: ["Europe/Helsinki"],
  FO: ["Atlantic/Faroe"],
  FR: ["Europe/Paris"],
  GB: ["Europe/London"],
  GG: ["Europe/Guernsey"],
  GI: ["Europe/Gibraltar"],
  GR: ["Europe/Athens"],
  HR: ["Europe/Zagreb"],
  HU: ["Europe/Budapest"],
  IE: ["Europe/Dublin"],
  IM: ["Europe/Isle_of_Man"],
  IS: ["Atlantic/Reykjavik"],
  IT: ["Europe/Rome"],
  JE: ["Europe/Jersey"],
  LI: ["Europe/Vaduz"],
  LT: ["Europe/Vilnius"],
  LU: ["Europe/Luxembourg"],
  LV: ["Europe/Riga"],
  MC: ["Europe/Monaco"],
  MD: ["Europe/Chisinau"],
  ME: ["Europe/Podgorica"],
  MK: ["Europe/Skopje"],
  MT: ["Europe/Malta"],
  NL: ["Europe/Amsterdam"],
  NO: ["Europe/Oslo"],
  PL: ["Europe/Warsaw"],
  PT: ["Europe/Lisbon", "Atlantic/Azores", "Atlantic/Madeira"],
  RO: ["Europe/Bucharest"],
  RS: ["Europe/Belgrade"],
  SE: ["Europe/Stockholm"],
  SI: ["Europe/Ljubljana"],
  SK: ["Europe/Bratislava"],
  SM: ["Europe/San_Marino"],
  UA: [
    "Europe/Kyiv",
    // The pre-2022 spelling. Still what plenty of devices report, because the
    // OS ships whatever tzdata it was built with.
    "Europe/Kiev",
    "Europe/Simferopol",
    "Europe/Uzhgorod",
    "Europe/Zaporozhye",
  ],
  VA: ["Europe/Vatican"],
  TR: ["Europe/Istanbul", "Asia/Istanbul"],
  RU: [
    "Europe/Moscow",
    "Europe/Kaliningrad",
    "Europe/Samara",
    "Europe/Saratov",
    "Europe/Ulyanovsk",
    "Europe/Volgograd",
    "Europe/Astrakhan",
    "Europe/Kirov",
    "Asia/Yekaterinburg",
    "Asia/Omsk",
    "Asia/Novosibirsk",
    "Asia/Novokuznetsk",
    "Asia/Barnaul",
    "Asia/Tomsk",
    "Asia/Krasnoyarsk",
    "Asia/Irkutsk",
    "Asia/Chita",
    "Asia/Yakutsk",
    "Asia/Khandyga",
    "Asia/Vladivostok",
    "Asia/Ust-Nera",
    "Asia/Magadan",
    "Asia/Sakhalin",
    "Asia/Srednekolymsk",
    "Asia/Kamchatka",
    "Asia/Anadyr",
  ],

  // --- North America
  US: [
    "America/New_York",
    "America/Detroit",
    "America/Chicago",
    "America/Denver",
    "America/Boise",
    "America/Phoenix",
    "America/Los_Angeles",
    "America/Anchorage",
    "America/Juneau",
    "America/Sitka",
    "America/Nome",
    "America/Yakutat",
    "America/Metlakatla",
    "America/Adak",
    "America/Menominee",
    "America/Kentucky/Louisville",
    "America/Kentucky/Monticello",
    "America/Indiana/Indianapolis",
    "America/Indiana/Vincennes",
    "America/Indiana/Winamac",
    "America/Indiana/Marengo",
    "America/Indiana/Petersburg",
    "America/Indiana/Vevay",
    "America/Indiana/Tell_City",
    "America/Indiana/Knox",
    "America/North_Dakota/Center",
    "America/North_Dakota/New_Salem",
    "America/North_Dakota/Beulah",
    "Pacific/Honolulu",
  ],
  CA: [
    "America/Toronto",
    "America/Vancouver",
    "America/Edmonton",
    "America/Winnipeg",
    "America/Halifax",
    "America/St_Johns",
    "America/Regina",
    "America/Swift_Current",
    "America/Moncton",
    "America/Glace_Bay",
    "America/Goose_Bay",
    "America/Whitehorse",
    "America/Dawson",
    "America/Dawson_Creek",
    "America/Fort_Nelson",
    "America/Creston",
    "America/Iqaluit",
    "America/Rankin_Inlet",
    "America/Resolute",
    "America/Cambridge_Bay",
    "America/Inuvik",
    "America/Yellowknife",
    "America/Atikokan",
    "America/Blanc-Sablon",
    "America/Nipigon",
    "America/Thunder_Bay",
    "America/Rainy_River",
  ],
  MX: [
    "America/Mexico_City",
    "America/Cancun",
    "America/Merida",
    "America/Monterrey",
    "America/Matamoros",
    "America/Chihuahua",
    "America/Ojinaga",
    "America/Mazatlan",
    "America/Bahia_Banderas",
    "America/Hermosillo",
    "America/Tijuana",
  ],

  // --- Central America and the Caribbean
  BS: ["America/Nassau"],
  BZ: ["America/Belize"],
  CR: ["America/Costa_Rica"],
  CU: ["America/Havana"],
  DO: ["America/Santo_Domingo"],
  GT: ["America/Guatemala"],
  HN: ["America/Tegucigalpa"],
  HT: ["America/Port-au-Prince"],
  JM: ["America/Jamaica"],
  NI: ["America/Managua"],
  PA: ["America/Panama"],
  PR: ["America/Puerto_Rico"],
  SV: ["America/El_Salvador"],
  TT: ["America/Port_of_Spain"],

  // --- South America
  AR: [
    "America/Argentina/Buenos_Aires",
    "America/Argentina/Cordoba",
    "America/Argentina/Mendoza",
    "America/Argentina/Salta",
    "America/Argentina/Tucuman",
    "America/Argentina/Jujuy",
    "America/Argentina/Catamarca",
    "America/Argentina/La_Rioja",
    "America/Argentina/San_Juan",
    "America/Argentina/San_Luis",
    "America/Argentina/Rio_Gallegos",
    "America/Argentina/Ushuaia",
  ],
  BO: ["America/La_Paz"],
  BR: [
    "America/Sao_Paulo",
    "America/Bahia",
    "America/Fortaleza",
    "America/Recife",
    "America/Maceio",
    "America/Belem",
    "America/Santarem",
    "America/Manaus",
    "America/Boa_Vista",
    "America/Porto_Velho",
    "America/Rio_Branco",
    "America/Eirunepe",
    "America/Cuiaba",
    "America/Campo_Grande",
    "America/Araguaina",
    "America/Noronha",
  ],
  CL: ["America/Santiago", "America/Punta_Arenas", "Pacific/Easter"],
  CO: ["America/Bogota"],
  EC: ["America/Guayaquil", "Pacific/Galapagos"],
  GF: ["America/Cayenne"],
  GY: ["America/Guyana"],
  PE: ["America/Lima"],
  PY: ["America/Asuncion"],
  SR: ["America/Paramaribo"],
  UY: ["America/Montevideo"],
  VE: ["America/Caracas"],

  // --- Asia
  AE: ["Asia/Dubai"],
  AF: ["Asia/Kabul"],
  AM: ["Asia/Yerevan"],
  AZ: ["Asia/Baku"],
  BD: ["Asia/Dhaka"],
  BH: ["Asia/Bahrain"],
  BN: ["Asia/Brunei"],
  BT: ["Asia/Thimphu"],
  CN: ["Asia/Shanghai", "Asia/Urumqi", "Asia/Chongqing", "Asia/Harbin"],
  GE: ["Asia/Tbilisi"],
  HK: ["Asia/Hong_Kong"],
  ID: ["Asia/Jakarta", "Asia/Pontianak", "Asia/Makassar", "Asia/Jayapura"],
  IL: ["Asia/Jerusalem", "Asia/Tel_Aviv"],
  IN: ["Asia/Kolkata", "Asia/Calcutta"],
  IQ: ["Asia/Baghdad"],
  IR: ["Asia/Tehran"],
  JO: ["Asia/Amman"],
  JP: ["Asia/Tokyo"],
  KG: ["Asia/Bishkek"],
  KH: ["Asia/Phnom_Penh"],
  KP: ["Asia/Pyongyang"],
  KR: ["Asia/Seoul"],
  KW: ["Asia/Kuwait"],
  KZ: [
    "Asia/Almaty",
    "Asia/Aqtau",
    "Asia/Aqtobe",
    "Asia/Atyrau",
    "Asia/Oral",
    "Asia/Qostanay",
    "Asia/Qyzylorda",
  ],
  LA: ["Asia/Vientiane"],
  LB: ["Asia/Beirut"],
  LK: ["Asia/Colombo"],
  MM: ["Asia/Yangon", "Asia/Rangoon"],
  MN: ["Asia/Ulaanbaatar", "Asia/Hovd", "Asia/Choibalsan"],
  MO: ["Asia/Macau"],
  MV: ["Indian/Maldives"],
  MY: ["Asia/Kuala_Lumpur", "Asia/Kuching"],
  NP: ["Asia/Kathmandu"],
  OM: ["Asia/Muscat"],
  PH: ["Asia/Manila"],
  PK: ["Asia/Karachi"],
  PS: ["Asia/Gaza", "Asia/Hebron"],
  QA: ["Asia/Qatar"],
  SA: ["Asia/Riyadh"],
  SG: ["Asia/Singapore"],
  SY: ["Asia/Damascus"],
  TH: ["Asia/Bangkok"],
  TJ: ["Asia/Dushanbe"],
  TL: ["Asia/Dili"],
  TM: ["Asia/Ashgabat"],
  TW: ["Asia/Taipei"],
  UZ: ["Asia/Tashkent", "Asia/Samarkand"],
  VN: ["Asia/Ho_Chi_Minh", "Asia/Saigon"],
  YE: ["Asia/Aden"],

  // --- Africa
  AO: ["Africa/Luanda"],
  BF: ["Africa/Ouagadougou"],
  BI: ["Africa/Bujumbura"],
  BJ: ["Africa/Porto-Novo"],
  BW: ["Africa/Gaborone"],
  CD: ["Africa/Kinshasa", "Africa/Lubumbashi"],
  CF: ["Africa/Bangui"],
  CG: ["Africa/Brazzaville"],
  CI: ["Africa/Abidjan"],
  CM: ["Africa/Douala"],
  CV: ["Atlantic/Cape_Verde"],
  DJ: ["Africa/Djibouti"],
  DZ: ["Africa/Algiers"],
  EG: ["Africa/Cairo"],
  EH: ["Africa/El_Aaiun"],
  ER: ["Africa/Asmara"],
  ET: ["Africa/Addis_Ababa"],
  GA: ["Africa/Libreville"],
  GH: ["Africa/Accra"],
  GM: ["Africa/Banjul"],
  GN: ["Africa/Conakry"],
  GQ: ["Africa/Malabo"],
  GW: ["Africa/Bissau"],
  KE: ["Africa/Nairobi"],
  LR: ["Africa/Monrovia"],
  LS: ["Africa/Maseru"],
  LY: ["Africa/Tripoli"],
  MA: ["Africa/Casablanca"],
  MG: ["Indian/Antananarivo"],
  ML: ["Africa/Bamako"],
  MR: ["Africa/Nouakchott"],
  MU: ["Indian/Mauritius"],
  MW: ["Africa/Blantyre"],
  MZ: ["Africa/Maputo"],
  NA: ["Africa/Windhoek"],
  NE: ["Africa/Niamey"],
  NG: ["Africa/Lagos"],
  RW: ["Africa/Kigali"],
  SD: ["Africa/Khartoum"],
  SL: ["Africa/Freetown"],
  SN: ["Africa/Dakar"],
  SO: ["Africa/Mogadishu"],
  SS: ["Africa/Juba"],
  ST: ["Africa/Sao_Tome"],
  SZ: ["Africa/Mbabane"],
  TD: ["Africa/Ndjamena"],
  TG: ["Africa/Lome"],
  TN: ["Africa/Tunis"],
  TZ: ["Africa/Dar_es_Salaam"],
  UG: ["Africa/Kampala"],
  ZA: ["Africa/Johannesburg"],
  ZM: ["Africa/Lusaka"],
  ZW: ["Africa/Harare"],

  // --- Oceania
  AS: ["Pacific/Pago_Pago"],
  AU: [
    "Australia/Sydney",
    "Australia/Melbourne",
    "Australia/Brisbane",
    "Australia/Perth",
    "Australia/Adelaide",
    "Australia/Darwin",
    "Australia/Hobart",
    "Australia/Canberra",
    "Australia/Broken_Hill",
    "Australia/Lord_Howe",
    "Australia/Lindeman",
    "Australia/Eucla",
    "Australia/Currie",
  ],
  FJ: ["Pacific/Fiji"],
  GU: ["Pacific/Guam"],
  KI: ["Pacific/Tarawa", "Pacific/Kiritimati", "Pacific/Enderbury"],
  MH: ["Pacific/Majuro", "Pacific/Kwajalein"],
  MP: ["Pacific/Saipan"],
  NC: ["Pacific/Noumea"],
  NZ: ["Pacific/Auckland", "Pacific/Chatham"],
  PF: ["Pacific/Tahiti", "Pacific/Marquesas", "Pacific/Gambier"],
  PG: ["Pacific/Port_Moresby", "Pacific/Bougainville"],
  PW: ["Pacific/Palau"],
  SB: ["Pacific/Guadalcanal"],
  TO: ["Pacific/Tongatapu"],
  VU: ["Pacific/Efate"],
  WS: ["Pacific/Apia"],
};

/** Inverted once on first use, not at import: most loads never ask. */
let zoneToCountry: Map<string, string> | null = null;

function countryForZone(tz: string): string | undefined {
  if (!zoneToCountry) {
    zoneToCountry = new Map();
    for (const [country, zones] of Object.entries(ZONES_BY_COUNTRY)) {
      for (const zone of zones) zoneToCountry.set(zone, country);
    }
  }
  return zoneToCountry.get(tz);
}

/** The device's IANA timezone, or undefined where `Intl` won't say. */
function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/** The region subtag of the first locale that carries one: "en-US" -> "US". */
function localeRegion(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  const langs = [...(navigator.languages ?? []), navigator.language].filter(
    Boolean,
  );
  for (const tag of langs) {
    // Also handles "zh-Hant-TW", where the region is last.
    const region = tag.split("-").find((p) => /^[A-Z]{2}$/.test(p));
    if (region) return region;
  }
  return undefined;
}

/**
 * The user's country as ISO 3166-1 alpha-2, or undefined if it can't be told.
 *
 * **The timezone is asked first, and the locale only as a fallback.** Those
 * two answer different questions, and it took a wrong answer to see it: the
 * region subtag states which *conventions* you want, not where you are.
 * Running a phone in "English (United States)" is the default English option
 * on most devices and says nothing about the owner's location, so a Dutch
 * athlete on `en-US` was being told they were American and shown miles. The
 * IANA timezone comes from the device's own clock setting and tracks the place
 * it is in, which is the question actually being asked here.
 *
 * The locale still earns its place as the fallback: the zone table covers the
 * zones consumer devices report, not all of them, and a region subtag beats
 * nothing at all. Undefined is a perfectly good last answer, since it means
 * metric, which is right for most of the world.
 */
export function detectCountry(): string | undefined {
  if (typeof navigator === "undefined") return undefined;

  const tz = deviceTimeZone();
  const fromZone = tz ? countryForZone(tz) : undefined;
  return fromZone ?? localeRegion();
}

/** How `detectCountry` reached its answer. For the debug panel only. */
export function countrySource(): "timezone" | "locale" | "none" {
  if (typeof navigator === "undefined") return "none";
  const tz = deviceTimeZone();
  if (tz && countryForZone(tz)) return "timezone";
  return localeRegion() ? "locale" : "none";
}

/** Country name for display, in the given locale. Falls back to the code. */
export function countryName(code: string, locale = "en"): string {
  try {
    return (
      new Intl.DisplayNames([locale], { type: "region" }).of(
        code.toUpperCase(),
      ) ?? code
    );
  } catch {
    return code;
  }
}
