export type Country = {
  name: string;
  officialName?: string;
  alpha2: string;
  alpha3: string;
  flagSvg: string;
  flagPng?: string;
  demonym?: string;
};

export async function getCountries(): Promise<Country[]> {
  const res = await fetch(`/api/countries`, { cache: "force-cache" });
  if (!res.ok) throw new Error("Failed to load countries");
  const json = (await res.json()) as { countries: Country[] };
  return json.countries;
}

export type VisaArea = "US" | "Schengen" | "UK";

// Simple mapping for demo: map a selected destination country alpha2 to visa area
// In real life, you'd implement rules (e.g., if destination is within Schengen states).
const SCHENGEN_ALPHA2 = new Set([
  "AT",
  "BE",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IS",
  "IT",
  "LV",
  "LI",
  "LT",
  "LU",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "SK",
  "SI",
  "ES",
  "SE",
  "CH",
]);

export function visaAreaForDestination(alpha2: string | null): VisaArea | null {
  if (!alpha2) return null;
  const up = alpha2.toUpperCase();
  if (up === "US") return "US";
  if (up === "GB") return "UK";
  if (SCHENGEN_ALPHA2.has(up)) return "Schengen";
  return null;
}
