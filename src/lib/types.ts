export type Texture = "crispy" | "saucy" | "soupy" | "fresh" | "creamy" | "chewy" | "tender" | "gooey";

/** Answers that apply to the whole meal (asked once, even in "for two" mode). */
export type Meal = "breakfast" | "lunch" | "dinner";

export type Venue = "restaurant" | "bar" | "coffee" | "dessert" | "describe";

export interface SharedAnswers {
  /** what kind of place they want; "describe" hands a free-text description to Claude */
  venue: Venue;
  /** going right now, or at a chosen time later */
  when: "now" | "later";
  /** for "later": local date and time as "YYYY-MM-DDTHH:mm" */
  whenAt: string;
  /** restaurants only: guessed from the time (now, or the chosen time), not asked */
  meal: Meal;
  /** the "describe" venue: what they want, in their own words */
  description: string;
  speed: "quick" | "sitdown" | "either";
  dress: "sweats" | "dressed" | "either";
  service: "dinein" | "takeout" | "delivery";
  /** budget per person */
  budget: "under10" | "10to20" | "20to30" | "30plus";
  occasion: "casual" | "date";
  /** how you're getting there (delivery is always treated as driving) */
  travelMode: "walk" | "bike" | "drive";
  /** longest acceptable trip, in minutes (estimated from straight-line distance) */
  maxTravelMin: number;
  /** takeout only: affects which cuisines travel/eat well */
  eatingAt: "home" | "onthego";
  /** Free text, e.g. "something warm, it's raining" (LLM interpretation comes later) */
  extra: string;
}

/** Answers that differ per person (asked separately in "for two" mode). */
export interface PersonAnswers {
  /** 1 (snack) to 5 (starving) */
  hunger: number;
  weight: "heavy" | "light" | "either";
  adventure: "comfort" | "new" | "either";
  textures: Texture[];
  temperature: "hot" | "cold" | "either";
  /** how messy a meal they're okay with */
  mess: "tidy" | "some" | "messy" | "either";
  /** cuisine keys eaten in the last couple of days */
  recent: string[];
  /** cuisine keys that are a hard no today */
  hardNos: string[];
  /** winners of the A-vs-B rounds */
  duelPicks: string[];
  lastGreatMeal: string;
  dietary: string[];
  /** bar / coffee / dessert: picked styles (keys from venues.ts) */
  styles: string[];
  /** bar / coffee: how they want the place to feel ("" = no preference) */
  vibe: string;
}

export interface RecommendRequest {
  /** plain-language summary of the answers (built by describeAnswers), used by the fit-check */
  profile: string;
  /** restaurant cuisine keys, or style keys for bar / coffee / dessert. Unused for "describe". */
  directions: string[];
  vibes: string[];
  shared: SharedAnswers;
  dietary: string[];
  location: { lat: number; lng: number };
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  /** 1-4, undefined if Google has no price data */
  priceLevel?: number;
  cuisine?: string;
  /** which craving direction found this place */
  direction: string;
  openNow?: boolean;
  distanceMiles: number;
  /** estimated minutes to get there (or for the restaurant to be that far away, for delivery) */
  travelMin: number;
  mapsUrl?: string;
  score: number;
  /** for "later": the place's hours on the chosen day */
  hours?: string;
  trustedPick?: boolean;
  /** 1-2 sentences about the atmosphere */
  vibe?: string;
  /** one sentence on why it fits their answers (from the fit-check) */
  why?: string;
  /** 0-10 fit score from the fit-check */
  fit?: number;
  /** data: URI of an interior photo (or the best available one), when Google returns photos */
  photoUrl?: string;
  photoCredit?: { name: string; uri?: string };
}
