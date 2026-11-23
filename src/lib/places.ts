import { DIETARY } from "./cuisines";
import type { RecommendRequest } from "./types";
import type { OpeningHours } from "./hours";
import { maxMiles } from "./travel";
import { VIBE_WORDS, venueSuffix } from "./venues";

const MILES_TO_METERS = 1609.34;

const PRICE_TO_NUM: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

export interface RawPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  primaryTypeDisplayName?: { text: string };
  googleMapsUri?: string;
  location?: { latitude: number; longitude: number };
  regularOpeningHours?: OpeningHours;
  dineIn?: boolean;
  takeout?: boolean;
  delivery?: boolean;
  servesVegetarianFood?: boolean;
  primaryType?: string;
  types?: string[];
  // Atmosphere info, used to describe the vibe
  editorialSummary?: { text?: string };
  generativeSummary?: { overview?: { text?: string } };
  reviewSummary?: { text?: { text?: string } };
  photos?: { name: string; authorAttributions?: { displayName?: string; uri?: string }[] }[];
  outdoorSeating?: boolean;
  liveMusic?: boolean;
  goodForGroups?: boolean;
  allowsDogs?: boolean;
  goodForWatchingSports?: boolean;
  servesCocktails?: boolean;
  servesBeer?: boolean;
  servesWine?: boolean;
}

// Only request the fields we use: Places API (New) bills by field tier.
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.primaryTypeDisplayName",
  "places.googleMapsUri",
  "places.location",
  "places.regularOpeningHours",
  "places.dineIn",
  "places.takeout",
  "places.delivery",
  "places.servesVegetarianFood",
  "places.primaryType",
  "places.types",
  "places.editorialSummary",
  "places.generativeSummary",
  "places.reviewSummary",
  "places.photos",
  "places.outdoorSeating",
  "places.liveMusic",
  "places.goodForGroups",
  "places.allowsDogs",
  "places.goodForWatchingSports",
  "places.servesCocktails",
  "places.servesBeer",
  "places.servesWine",
].join(",");

export function priceToNumber(p?: string): number | undefined {
  return p ? PRICE_TO_NUM[p] : undefined;
}

/** Combine one direction's search phrase with dietary needs, vibe and any extra notes. */
export function buildQuery(directionQuery: string, req: RecommendRequest): string {
  const dietWords = req.dietary
    .map((d) => DIETARY.find((x) => x.value === d)?.query)
    .filter(Boolean);
  const vibeWords = req.vibes.map((v) => VIBE_WORDS[v]).filter(Boolean);
  const parts = [
    ...vibeWords,
    ...dietWords,
    directionQuery,
    req.shared.venue === "describe" ? "" : req.shared.extra.trim(),
    venueSuffix(req.shared.venue),
  ];
  return parts.filter(Boolean).join(" ");
}

/**
 * Identical searches within 30 minutes reuse the earlier answer instead of calling Google again.
 * This matters because the project's daily search quota is small, and repeat runs (testing, or
 * "start over" with the same answers) would otherwise burn it. Kept on globalThis so it survives
 * hot reloads in dev.
 */
const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = ((globalThis as unknown as { __placesCache?: Map<string, { at: number; places: RawPlace[] }> }).__placesCache ??=
  new Map());

async function textSearch(query: string, req: RecommendRequest, placeType?: string): Promise<RawPlace[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY is not set (see .env.example)");

  const radius = Math.min(maxMiles(req.shared) * MILES_TO_METERS, 50000);

  const openNow = req.shared.when === "now";
  const cacheKey = JSON.stringify([query, placeType ?? "", openNow, req.location.lat.toFixed(3), req.location.lng.toFixed(3), Math.round(radius)]);
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.places;

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      // Going now: only places open right now. Going later: hours are checked per place afterwards.
      ...(openNow ? { openNow: true } : {}),
      pageSize: 20,
      ...(placeType ? { includedType: placeType, strictTypeFiltering: true } : {}),
      locationBias: {
        circle: {
          center: { latitude: req.location.lat, longitude: req.location.lng },
          radius,
        },
      },
    }),
  });

  if (res.status === 429) {
    throw new Error(
      "Google's daily search limit for this project has been reached. It resets daily (around midnight Pacific), or you can raise the Places API quota in Google Cloud Console.",
    );
  }
  if (!res.ok) {
    throw new Error(`Places API error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const places: RawPlace[] = data.places ?? [];
  cache.set(cacheKey, { at: Date.now(), places });
  return places;
}

/**
 * Search for one direction. With a place type we ask Google to return only that kind of place;
 * if that finds few (Google tags places loosely and small towns have fewer), top up with a plain search (an extra Google call, so only when needed). The fit-check later weeds out the strays.
 */
export async function searchPlaces(directionQuery: string, req: RecommendRequest, placeType?: string): Promise<RawPlace[]> {
  const query = buildQuery(directionQuery, req);
  if (!placeType) return textSearch(query, req);

  const strict = await textSearch(query, req, placeType);
  if (strict.length >= 5) return strict;
  const loose = await textSearch(query, req);
  const seen = new Set(strict.map((p) => p.id));
  return [...strict, ...loose.filter((p) => !seen.has(p.id))];
}
