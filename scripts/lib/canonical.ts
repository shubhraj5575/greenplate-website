// Canonical-name normalization. Two raw rows that resolve to the same
// canonical_name are candidates for dedup in reconcile-food-db.ts.

const REMOVE_PARENS = /\s*\([^)]*\)\s*/g;
const REMOVE_BRACKETS = /\s*\[[^\]]*\]\s*/g;
const PUNCT = /[.,;:'"`]/g;
const MULTI_SPACE = /\s+/g;

const COMMON_SUFFIX_STRIP = [
  / fresh$/,
  / dried$/,
  / cooked$/,
  / raw$/,
  / boiled$/,
  / steamed$/,
  / frozen$/,
  / canned$/,
  / whole$/,
  / processed$/,
];

export function canonicalize(raw: string): string {
  if (!raw) return "";
  let s = raw.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  s = s.toLowerCase().trim();
  s = s.replace(REMOVE_PARENS, " ");
  s = s.replace(REMOVE_BRACKETS, " ");
  s = s.replace(PUNCT, "");
  s = s.replace(/[^a-z0-9\s-]/g, " ");
  s = s.replace(MULTI_SPACE, " ").trim();
  for (const re of COMMON_SUFFIX_STRIP) s = s.replace(re, "").trim();
  s = naiveSingularize(s);
  return s;
}

function naiveSingularize(s: string): string {
  // Avoid butchering well-known compound terms.
  if (s.endsWith("ies") && s.length > 4) return s.slice(0, -3) + "y";
  if (s.endsWith("ses") && s.length > 4) return s.slice(0, -2);
  if (s.endsWith("oes") && s.length > 4) return s.slice(0, -2);
  if (s.endsWith("s") && !s.endsWith("ss") && s.length > 3) return s.slice(0, -1);
  return s;
}

export function mapDataQuality(
  raw: string | null | undefined,
): "high" | "medium" | "low" {
  if (!raw) return "medium";
  const v = raw.toLowerCase();
  if (
    v.includes("peer") ||
    v.includes("high") ||
    v.includes("excellent") ||
    v.includes("very good")
  )
    return "high";
  if (v.includes("low") || v.includes("estimated") || v.includes("rough"))
    return "low";
  return "medium";
}

export function isIndian(region: string | null | undefined): boolean {
  if (!region) return false;
  const r = region.toLowerCase();
  return r.includes("india") || r.includes("pan-india") || r === "in";
}
