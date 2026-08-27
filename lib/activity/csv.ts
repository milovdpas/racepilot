// A CSV reader, because there was not one and `split(",")` is wrong here.
//
// Strava's activities.csv puts free text in `Activity Name` and
// `Activity Description`: commas, quotes and newlines all appear inside fields
// in a real export. Splitting on commas silently shifts every column after the
// first quoted comma, which is the kind of bug that produces a plausible wrong
// number rather than an error.
//
// RFC 4180, plus the two things real files do that the RFC does not mention:
// a UTF-8 BOM (Excel writes one, and Strava's file has one) and bare \r\n.

/**
 * Split CSV text into rows of raw cell strings.
 *
 * Quotes are only special at the start of a field, which is what lets an
 * unquoted `5'10"` pass through untouched. A doubled `""` inside a quoted field
 * is one literal quote.
 */
export function parseCsv(text: string): string[][] {
  // The BOM would otherwise become part of the first header name, so
  // `headers[0] === "Activity ID"` would quietly be false.
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let started = false; // has this field begun? decides if a quote opens it

  const endField = () => {
    row.push(field);
    field = "";
    started = false;
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < src.length; i++) {
    const c = src[i];

    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"' && !started) {
      quoted = true;
      started = true;
    } else if (c === ",") {
      endField();
    } else if (c === "\n") {
      endRow();
    } else if (c === "\r") {
      // Swallow; the \n that follows ends the row. A lone \r ends it too.
      if (src[i + 1] !== "\n") endRow();
    } else {
      field += c;
      started = true;
    }
  }

  // A file not ending in a newline still has a final row - unless the last
  // thing we saw was a row terminator, which would otherwise add a phantom
  // empty row that every caller then has to filter out.
  if (field !== "" || row.length > 0) endRow();

  return rows;
}
