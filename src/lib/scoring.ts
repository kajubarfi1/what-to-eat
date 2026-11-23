import { CUISINES, type Cuisine } from "./cuisines";
import { STYLES, type StyleVenue } from "./venues";
import type { Meal, PersonAnswers, SharedAnswers } from "./types";

/** Score every cuisine for one person. -Infinity means excluded (hard no). */
export function scorePerson(p: PersonAnswers): Record<string, number> {
  const out: Record<string, number> = {};
  const meal = p.lastGreatMeal.toLowerCase();
  const avoidMeat = p.dietary.includes("vegetarian") || p.dietary.includes("vegan");

  for (const c of CUISINES) {
    if (p.hardNos.includes(c.key)) {
      out[c.key] = -Infinity;
      continue;
    }
    let s = 0;

    // Heavy vs light (hunger nudges it)
    const lean = p.weight === "heavy" ? 1 : p.weight === "light" ? -1 : 0;
    const wscore = c.weight === "heavy" ? 1 : c.weight === "light" ? -1 : 0;
    s += lean * wscore * 2 + (c.weight === "mid" && lean !== 0 ? 0.5 : 0);
    if (p.hunger >= 4 && c.weight === "heavy") s += 1;
    if (p.hunger <= 2 && c.weight === "light") s += 1;

    // Comfort vs adventure
    if (p.adventure === "comfort") s += c.novelty === 1 ? 2 : c.novelty === 2 ? 1 : -1;
    if (p.adventure === "new") s += c.novelty === 3 ? 2 : c.novelty === 2 ? 1 : -1;

    // Texture, temperature, hands
    s += p.textures.filter((t) => c.textures.includes(t)).length;
    s += tempScore(p.temperature, c);
    s += messScore(p.mess, c);

    // Elimination signals
    if (p.recent.includes(c.key)) s -= 4;
    if (p.duelPicks.includes(c.key)) s += 2;
    if (meal && (meal.includes(c.label.toLowerCase()) || meal.includes(c.key))) s += 2;

    if (avoidMeat && c.meaty) s -= 2;
    out[c.key] = s;
  }
  return out;
}

function tempScore(pref: PersonAnswers["temperature"], c: Cuisine) {
  if (pref === "either") return 0;
  if (c.temp === "both") return 0;
  return c.temp === pref ? 2 : -2;
}

/** "How messy is it okay to be?" is an upper limit: penalize anything messier than that. */
function messScore(pref: PersonAnswers["mess"], c: Cuisine) {
  if (pref === "either") return 0;
  const limit = pref === "tidy" ? 1 : pref === "some" ? 2 : 3;
  if (c.mess > limit) return -1.5 * (c.mess - limit);
  return pref === "messy" && c.mess === 3 ? 1 : 0;
}

/**
 * Combine one or two people. For two, reward cuisines both like: average plus
 * half the lower score, so a place one person dislikes doesn't win. Any hard no excludes.
 */
export function rankCuisines(
  people: PersonAnswers[],
  shared?: SharedAnswers,
): { key: string; score: number }[] {
  const meal = shared?.meal;
  const onTheGo = shared?.service === "takeout" && shared.eatingAt === "onthego";
  const scored = people.map(scorePerson);
  const ranked: { key: string; score: number }[] = [];
  for (const c of CUISINES) {
    const vals = scored.map((s) => s[c.key]);
    if (vals.some((v) => v === -Infinity)) continue;
    // Eating on the go: soups and fork-and-knife meals are awkward.
    const penalty = onTheGo ? (c.textures.includes("soupy") ? 2 : 0) + (c.hands === "utensils" ? 1 : 0) : 0;
    const mealAdj = meal ? mealAdjustment(meal, c.key) : 0;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const score = (vals.length > 1 ? avg + 0.5 * Math.min(...vals) : avg) - penalty + mealAdj;
    ranked.push({ key: c.key, score });
  }
  return ranked.sort((a, b) => b.score - a.score);
}

/** What's appropriate changes with the meal: brunch spots at breakfast, no pancakes for dinner. */
function mealAdjustment(meal: Meal, key: string): number {
  if (meal === "breakfast") {
    if (key === "breakfast") return 6;
    if (key === "sandwiches") return 1;
    if (key === "dessert") return 0;
    return -3;
  }
  if (meal === "lunch") {
    if (key === "breakfast") return -1;
    if (key === "steakhouse") return -1;
    return 0;
  }
  // dinner
  if (key === "breakfast") return -4;
  return 0;
}

/**
 * Bars, coffee shops and dessert places: rank styles by how many people picked them.
 * If nobody picked anything, fall back to the default order. Returns the top 3 keys.
 */
export function rankStyles(venue: StyleVenue, people: PersonAnswers[]): string[] {
  const counts = new Map<string, number>();
  for (const p of people) for (const k of p.styles) counts.set(k, (counts.get(k) ?? 0) + 1);
  const sorted = [...STYLES[venue]].sort((a, b) => (counts.get(b.key) ?? 0) - (counts.get(a.key) ?? 0));
  const picked = sorted.filter((d) => (counts.get(d.key) ?? 0) > 0);
  return (picked.length > 0 ? picked : sorted).slice(0, 3).map((d) => d.key);
}
