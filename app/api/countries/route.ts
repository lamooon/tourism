import { NextResponse } from "next/server";

type RestCountry = {
  name: { common: string; official?: string };
  cca2: string;
  cca3: string;
  flags?: { svg?: string; png?: string; alt?: string };
  demonyms?: Record<string, { f?: string; m?: string }>;
};

export type Country = {
  name: string;
  officialName?: string;
  alpha2: string;
  alpha3: string;
  flagSvg: string;
  flagPng?: string;
  demonym?: string;
};

async function fetchCountries(): Promise<Country[]> {
  const url =
    "https://restcountries.com/v3.1/all?fields=name,cca2,cca3,flags,demonyms";
  const res = await fetch(url, {
    // Cache for a day on the server
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Failed to fetch countries: ${res.status}`);
  const data = (await res.json()) as RestCountry[];
  const countries: Country[] = data
    .map((c) => {
      const alpha2 = c.cca2?.toUpperCase?.() ?? "";
      const alpha3 = c.cca3?.toUpperCase?.() ?? "";
      if (!alpha2 || !alpha3 || !c.name?.common) return null;
      const demonym = c.demonyms?.eng?.m || c.demonyms?.eng?.f;
      const flagSvg =
        c.flags?.svg ||
        (alpha2 ? `https://flagcdn.com/${alpha2.toLowerCase()}.svg` : "");
      const flagPng = c.flags?.png;
      return {
        name: c.name.common,
        officialName: c.name.official,
        alpha2,
        alpha3,
        flagSvg,
        flagPng,
        demonym: demonym || undefined,
      } as Country;
    })
    .filter(Boolean) as Country[];

  countries.sort((a, b) => a.name.localeCompare(b.name));
  return countries;
}

export async function GET() {
  try {
    const countries = await fetchCountries();
    return NextResponse.json({ countries });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
