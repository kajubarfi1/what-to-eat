import trusted from "../../data/trusted-picks.json";
import type { RecommendRequest, Restaurant } from "./types";
import { priceToNumber, type RawPlace } from "./places";
import { hoursFor, isOpenAt } from "./hours";
import { estimateMinutes, maxMiles } from "./travel";

const EARTH_RADIUS_MILES = 3958.8;

function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

/** Pull low-review-count ratings toward the average so a 5.0 from 3 reviews doesn't win. */
function bayesianRating(rating: number, count: number, prior = 4.0, weight = 50) {
  return (count / (count + weight)) * rating + (weight / (count + weight)) * prior;
}

const trustedMap = new Map(
  (trusted.picks as { name: string; score?: number }[]).map((p) => [p.name.toLowerCase(), p.score ?? 1]),
);

/**
 * Google only gives price tiers ($ to $$$$, roughly: under 10, 10-25, 25-50, 50+ per person),
 * so each budget bucket maps to a highest tier we'll show and a tier we aim for.
 */
const BUDGET_TIERS = {
  under10: { max: 1, target: 1 },
  "10to20": { max: 2, target: 1.8 },
  "20to30": { max: 3, target: 2.3 },
  "30plus": { max: 4, target: 3.3 },
} as const;

/** Big chains and fast food, hidden unless you want cheap or fast. Matched on the start of the name. */
const CHAINS = [
  "mcdonald's", "burger king", "wendy's", "taco bell", "kfc", "popeyes", "subway", "chick-fil-a", "whataburger",
  "jack in the box", "sonic drive", "arby's", "dairy queen", "raising cane's", "wingstop", "buffalo wild wings",
  "domino's", "pizza hut", "papa john's", "little caesars", "marco's pizza", "jimmy john's", "jersey mike's",
  "panda express", "chipotle", "qdoba", "panera", "denny's", "ihop", "applebee's", "chili's", "olive garden",
  "red lobster", "cracker barrel", "waffle house", "starbucks", "dunkin", "dutch bros", "krispy kreme",
  "dave & buster's", "buffalo wild", "texas roadhouse", "outback steakhouse", "golden corral",
];

const isChain = (name: string) => {
  const n = name.toLowerCase().replace(/[\u2019]/g, "'");
  return CHAINS.some((c) => n.startsWith(c));
};

/** Places that are never the answer to "where should we eat". */
const NOT_A_MEAL = ["amusement_center", "amusement_park", "casino", "bowling_alley", "movie_theater", "gas_station", "convenience_store", "grocery_store", "supermarket"];

/** Quality floors, strictest first. We use the first one that leaves enough places to choose from. */
const QUALITY_TIERS = [
  { rating: 4.2, reviews: 50 },
  { rating: 4.0, reviews: 25 },
  { rating: 0, reviews: 0 },
];

export interface PlacesForCuisine {
  /** shown on each result so you know which craving found it */
  label: string;
  /** 0 = best direction; earlier directions get a small boost */
  directionIndex: number;
  places: RawPlace[];
}

export function rankPlaces(groups: PlacesForCuisine[], req: RecommendRequest, limit = 16): Restaurant[] {
  const { shared } = req;
  const best = new Map<string, Restaurant>();

  // Price tier the group can afford, and the tier we aim for (just under the cap),
  // nudged by dress code and occasion.
  const maxLevel: number = BUDGET_TIERS[shared.budget].max;
  let target: number = BUDGET_TIERS[shared.budget].target;
  if (shared.service === "dinein") {
    if (shared.dress === "dressed") target += 0.5;
    if (shared.dress === "sweats") target -= 0.5;
    if (shared.occasion === "date") target += 0.5;
  }

  const radiusMiles = maxMiles(shared);
  // Fast food and chains only make the cut when the cheapest budget or "in and out" was chosen.
  const allowFast = shared.budget === "under10" || shared.speed === "quick";
  const needVeg = req.dietary.includes("vegetarian") || req.dietary.includes("vegan");

  for (const { label, directionIndex, places } of groups) {
    for (const p of places) {
      if (!p.location || p.rating == null) continue;

      const distanceMiles = haversineMiles(req.location, {
        lat: p.location.latitude,
        lng: p.location.longitude,
      });
      if (distanceMiles > radiusMiles) continue;

      // Hard filters. Unknown (undefined) values pass, since Google data is patchy.
      const price = priceToNumber(p.priceLevel);
      if (price != null && price > maxLevel) continue;
      // Going later: it has to be open at the chosen time (places with no listed hours pass).
      if (shared.when === "later" && isOpenAt(p.regularOpeningHours, shared.whenAt) === false) continue;
      if (shared.service === "dinein" && p.dineIn === false) continue;
      if (shared.service === "takeout" && p.takeout === false) continue;
      if (shared.service === "delivery" && p.delivery === false) continue;
      if (needVeg && p.servesVegetarianFood === false) continue;

      // Not the right kind of place at all (arcades, nightclubs, gas stations, ...).
      const typeSet = new Set([p.primaryType, ...(p.types ?? [])].filter(Boolean));
      if (NOT_A_MEAL.some((t) => typeSet.has(t))) continue;
      if (shared.venue !== "bar" && typeSet.has("night_club")) continue;
      if (shared.venue === "restaurant" && ["bar", "pub", "night_club"].includes(p.primaryType ?? "")) continue;

      const name = p.displayName?.text ?? "Unknown";
      if (!allowFast && (typeSet.has("fast_food_restaurant") || isChain(name))) continue;
      const reviewCount = p.userRatingCount ?? 0;
      const trustedScore = trustedMap.get(name.toLowerCase());

      let score = bayesianRating(p.rating, reviewCount) / 5;
      score -= (distanceMiles / radiusMiles) * 0.1;
      if (price != null) score -= Math.abs(price - target) * 0.04;
      if (shared.service === "takeout" && shared.speed === "quick" && p.takeout) score += 0.03;
      score += Math.max(0, 0.04 - directionIndex * 0.02);
      score += (trustedScore ?? 0) * 0.1;

      const r: Restaurant = {
        id: p.id,
        name,
        address: p.formattedAddress ?? "",
        rating: p.rating,
        reviewCount,
        priceLevel: price,
        cuisine: p.primaryTypeDisplayName?.text,
        direction: label,
        openNow: p.regularOpeningHours?.openNow,
        distanceMiles,
        travelMin: estimateMinutes(distanceMiles, shared),
        mapsUrl: p.googleMapsUri,
        hours: shared.when === "later" ? hoursFor(p.regularOpeningHours, shared.whenAt) : undefined,
        score,
        trustedPick: trustedScore != null,
      };
      const prev = best.get(r.id);
      if (!prev || prev.score < r.score) best.set(r.id, r);
    }
  }

  const sorted = [...best.values()].sort((a, b) => b.score - a.score);
  for (const tier of QUALITY_TIERS) {
    const good = sorted.filter((r) => r.rating >= tier.rating && r.reviewCount >= tier.reviews);
    if (good.length >= 6 || tier === QUALITY_TIERS[QUALITY_TIERS.length - 1]) return good.slice(0, limit);
  }
  return sorted.slice(0, limit);
}
