import Papa from "papaparse";

/** Fetch and parse CSV. If opts.header === false, returns array-of-arrays. */
export async function fetchCsv(url, opts = { header: true }) {
  if (!url) return [];
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status} ${res.statusText}`);
  const text = await res.text();
  const { data } = Papa.parse(text, {
    header: !!opts.header,
    skipEmptyLines: true,
    dynamicTyping: false, // we'll normalize ourselves
  });
  return data;
}

/** Normalize Italian decimals like "0,45" -> 0.45 */
export function toNumber(val, allowFloat = false) {
  if (val === null || val === undefined || val === "") return 0;
  const s = String(val).replace(",", ".").trim();
  const n = allowFloat ? parseFloat(s) : parseInt(s, 10);
  return Number.isNaN(n) ? 0 : n;
}