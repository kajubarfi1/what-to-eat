import type { Venue } from "./types";

export interface Direction {
  key: string;
  label: string;
  /** Google Text Search phrase */
  query: string;
  /** Google place type used to filter the search (omitted when Google has no good one) */
  placeType?: string;
}

/** Venues that have their own list of styles (restaurants use CUISINES instead). */
export type StyleVenue = "bar" | "coffee" | "dessert";

export const STYLES: Record<StyleVenue, Direction[]> = {
  bar: [
    { key: "cocktail", label: "Cocktails", query: "cocktail bar", placeType: "cocktail_bar" },
    { key: "beer", label: "Beer / pub", query: "pub craft beer", placeType: "pub" },
    { key: "wine", label: "Wine", query: "wine bar", placeType: "wine_bar" },
    { key: "dive", label: "Dive bar", query: "dive bar", placeType: "bar" },
    { key: "rooftop", label: "Rooftop / patio", query: "rooftop bar patio", placeType: "bar" },
    { key: "sports", label: "Sports bar", query: "sports bar", placeType: "sports_bar" },
  ],
  coffee: [
    { key: "espresso", label: "Specialty espresso", query: "specialty coffee espresso", placeType: "coffee_shop" },
    { key: "latte", label: "Lattes", query: "latte cafe", placeType: "coffee_shop" },
    { key: "matcha", label: "Matcha / tea", query: "matcha tea" },
    { key: "boba", label: "Boba", query: "boba bubble tea" },
    { key: "cafe", label: "Café with pastries", query: "cafe pastries", placeType: "cafe" },
  ],
  dessert: [
    { key: "icecream", label: "Ice cream", query: "ice cream", placeType: "ice_cream_shop" },
    { key: "bakery", label: "Bakery", query: "bakery pastries", placeType: "bakery" },
    { key: "chocolate", label: "Chocolate", query: "chocolate shop", placeType: "chocolate_shop" },
    { key: "donuts", label: "Donuts", query: "donuts", placeType: "donut_shop" },
    { key: "cookies", label: "Cookies", query: "cookies" },
    { key: "cake", label: "Cake", query: "cake shop", placeType: "bakery" },
    { key: "crepes", label: "Crepes / waffles", query: "crepes waffles" },
  ],
};

/** "How do you want it to feel?" answers, turned into extra search words. */
export const VIBE_WORDS: Record<string, string> = {
  chill: "cozy laid back",
  lively: "lively fun",
  upscale: "upscale craft",
  work: "laptop friendly quiet",
  catchup: "cozy",
  togo: "quick grab and go",
};

export function directionsFor(venue: StyleVenue, keys: string[]): Direction[] {
  return keys.map((k) => STYLES[venue].find((d) => d.key === k)).filter((d): d is Direction => !!d);
}

export function isStyleVenue(v: Venue): v is StyleVenue {
  return v === "bar" || v === "coffee" || v === "dessert";
}

/** Only restaurants get "restaurant" appended; the other venues' queries already say what they are. */
export function venueSuffix(venue: Venue): string {
  return venue === "restaurant" ? "restaurant" : "";
}
