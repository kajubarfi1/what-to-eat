import type { Texture } from "./types";

export interface Cuisine {
  key: string;
  label: string;
  /** Google Text Search phrase */
  query: string;
  /** Google place type used to filter the search (omitted when Google has no good one) */
  placeType?: string;
  weight: "heavy" | "mid" | "light";
  temp: "hot" | "cold" | "both";
  textures: Texture[];
  /** fork-and-knife vs. handheld (used for the "on the go" takeout penalty) */
  hands: "utensils" | "hands" | "both";
  /** 1 = tidy, 2 = a little messy, 3 = very messy */
  mess: 1 | 2 | 3;
  /** 1 = classic comfort, 3 = adventurous */
  novelty: 1 | 2 | 3;
  meaty?: boolean;
}

export const CUISINES: Cuisine[] = [
  { key: "pizza", label: "Pizza", query: "pizza", placeType: "pizza_restaurant", weight: "heavy", temp: "hot", textures: ["crispy", "saucy", "gooey", "chewy"], hands: "hands", mess: 2, novelty: 1 },
  { key: "burgers", label: "Burgers", query: "burgers", placeType: "hamburger_restaurant", weight: "heavy", temp: "hot", textures: ["crispy", "saucy", "tender", "gooey"], hands: "hands", mess: 3, novelty: 1, meaty: true },
  { key: "tacos", label: "Tacos", query: "tacos mexican", placeType: "mexican_restaurant", weight: "mid", temp: "hot", textures: ["crispy", "fresh", "saucy", "tender"], hands: "hands", mess: 3, novelty: 1 },
  { key: "ramen", label: "Ramen", query: "ramen", placeType: "ramen_restaurant", weight: "heavy", temp: "hot", textures: ["soupy", "saucy", "chewy", "creamy"], hands: "utensils", mess: 2, novelty: 2 },
  { key: "pho", label: "Pho / Vietnamese", query: "pho vietnamese", placeType: "vietnamese_restaurant", weight: "light", temp: "hot", textures: ["soupy", "fresh"], hands: "utensils", mess: 2, novelty: 2 },
  { key: "sushi", label: "Sushi", query: "sushi", placeType: "sushi_restaurant", weight: "light", temp: "cold", textures: ["fresh", "tender"], hands: "both", mess: 1, novelty: 2 },
  { key: "poke", label: "Poke / Bowls", query: "poke bowls", weight: "light", temp: "cold", textures: ["fresh"], hands: "utensils", mess: 1, novelty: 2 },
  { key: "salad", label: "Salads", query: "salads healthy", weight: "light", temp: "cold", textures: ["fresh", "crispy"], hands: "utensils", mess: 1, novelty: 1 },
  { key: "mediterranean", label: "Mediterranean", query: "mediterranean", placeType: "mediterranean_restaurant", weight: "mid", temp: "both", textures: ["fresh", "saucy", "creamy"], hands: "both", mess: 2, novelty: 2 },
  { key: "italian", label: "Italian / Pasta", query: "italian pasta", placeType: "italian_restaurant", weight: "heavy", temp: "hot", textures: ["saucy", "chewy", "creamy", "gooey"], hands: "utensils", mess: 2, novelty: 1 },
  { key: "thai", label: "Thai", query: "thai", placeType: "thai_restaurant", weight: "mid", temp: "hot", textures: ["saucy", "fresh", "creamy"], hands: "utensils", mess: 1, novelty: 2 },
  { key: "indian", label: "Indian", query: "indian", placeType: "indian_restaurant", weight: "heavy", temp: "hot", textures: ["saucy", "creamy"], hands: "both", mess: 2, novelty: 3 },
  { key: "chinese", label: "Chinese", query: "chinese", placeType: "chinese_restaurant", weight: "mid", temp: "hot", textures: ["saucy", "crispy", "chewy", "tender"], hands: "utensils", mess: 1, novelty: 1 },
  { key: "korean", label: "Korean", query: "korean", placeType: "korean_restaurant", weight: "mid", temp: "hot", textures: ["saucy", "soupy", "crispy", "chewy", "tender"], hands: "utensils", mess: 2, novelty: 3 },
  { key: "bbq", label: "BBQ", query: "bbq barbecue", placeType: "barbecue_restaurant", weight: "heavy", temp: "hot", textures: ["saucy", "tender"], hands: "hands", mess: 3, novelty: 1, meaty: true },
  { key: "sandwiches", label: "Sandwiches / Deli", query: "sandwiches deli", placeType: "sandwich_shop", weight: "mid", temp: "both", textures: ["crispy", "fresh", "chewy"], hands: "hands", mess: 2, novelty: 1 },
  { key: "breakfast", label: "Brunch / Breakfast", query: "brunch breakfast", placeType: "breakfast_restaurant", weight: "mid", temp: "hot", textures: ["crispy", "saucy", "gooey"], hands: "utensils", mess: 1, novelty: 1 },
  { key: "steakhouse", label: "Steakhouse", query: "steakhouse", placeType: "steak_house", weight: "heavy", temp: "hot", textures: ["tender"], hands: "utensils", mess: 1, novelty: 2, meaty: true },
  { key: "seafood", label: "Seafood", query: "seafood", placeType: "seafood_restaurant", weight: "mid", temp: "both", textures: ["fresh", "crispy", "tender"], hands: "both", mess: 2, novelty: 2 },
  { key: "wings", label: "Wings", query: "chicken wings", placeType: "chicken_wings_restaurant", weight: "heavy", temp: "hot", textures: ["crispy", "saucy", "tender"], hands: "hands", mess: 3, novelty: 1, meaty: true },
  { key: "dessert", label: "Dessert", query: "dessert ice cream bakery", weight: "light", temp: "both", textures: ["saucy", "creamy", "gooey"], hands: "both", mess: 2, novelty: 1 },
];

export const CUISINE_BY_KEY: Record<string, Cuisine> = Object.fromEntries(CUISINES.map((c) => [c.key, c]));

/** "Pick one" rounds: elimination is easier than choosing. */
export const DUELS: [string, string][] = [
  ["pizza", "sushi"],
  ["tacos", "burgers"],
  ["ramen", "italian"],
  ["thai", "mediterranean"],
  ["korean", "chinese"],
];


export const DIETARY: { value: string; label: string; query?: string }[] = [
  { value: "vegetarian", label: "Vegetarian", query: "vegetarian" },
  { value: "vegan", label: "Vegan", query: "vegan" },
  { value: "gluten-free", label: "Gluten-free", query: "gluten free" },
  { value: "dairy-free", label: "Dairy-free", query: "dairy free" },
  { value: "halal", label: "Halal", query: "halal" },
  { value: "kosher", label: "Kosher", query: "kosher" },
  { value: "high-protein", label: "High-protein (gym)", query: "high protein" },
  { value: "low-carb", label: "Low-carb", query: "low carb" },
  { value: "nut-allergy", label: "Nut allergy (confirm with the restaurant!)" },
];
