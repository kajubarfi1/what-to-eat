import { CUISINE_BY_KEY } from "./cuisines";
import { formatWhen } from "./hours";
import { labelFor } from "./steps";
import type { PersonAnswers, SharedAnswers } from "./types";
import { STYLES, isStyleVenue } from "./venues";

const HUNGER = ["", "just a snack", "kinda hungry", "hungry", "very hungry", "starving"];

const WEIGHT = { heavy: "something filling and cozy", light: "something light that leaves them energized" } as const;
const MESS = {
  tidy: "wants to keep it tidy",
  some: "a little mess is fine",
  messy: "doesn't mind a mess",
} as const;

function person(p: PersonAnswers, venue: SharedAnswers["venue"]): string[] {
  const out: string[] = [];
  if (venue === "restaurant") {
    out.push(`hunger: ${HUNGER[p.hunger]}`);
    if (p.weight !== "either") out.push(`wants ${WEIGHT[p.weight]}`);
    if (p.textures.length > 0) out.push(`textures they like: ${p.textures.join(", ")}`);
    if (p.temperature !== "either") out.push(p.temperature === "hot" ? "wants it hot and comforting" : "wants it cold and refreshing");
    if (p.mess !== "either") out.push(MESS[p.mess]);
    if (p.recent.length > 0) out.push(`had recently (avoid repeating): ${p.recent.map((k) => CUISINE_BY_KEY[k]?.label ?? k).join(", ")}`);
    if (p.hardNos.length > 0) out.push(`ruled out today: ${p.hardNos.map((k) => CUISINE_BY_KEY[k]?.label ?? k).join(", ")}`);
  } else if (isStyleVenue(venue)) {
    if (p.styles.length > 0) out.push(`in the mood for: ${p.styles.map((k) => STYLES[venue].find((d) => d.key === k)?.label ?? k).join(", ")}`);
    if (p.vibe) out.push(`vibe: ${p.vibe}`);
  }
  if (p.dietary.length > 0) out.push(`dietary: ${p.dietary.join(", ")}`);
  return out;
}

/** Plain-language summary of everything the person(s) answered, for Claude to judge candidates against. */
export function describeAnswers(shared: SharedAnswers, people: PersonAnswers[]): string {
  const lines: string[] = [`Looking for: ${labelFor("venue", shared.venue)}`];
  lines.push(shared.when === "later" ? `When: ${formatWhen(shared.whenAt)}` : "When: right now");
  if (shared.venue === "describe") lines.push(`In their own words: "${shared.description.trim()}"`);
  lines.push(`Service: ${labelFor("service", shared.service)}`);
  if (shared.venue === "restaurant" || shared.venue === "bar") {
    if (shared.service === "dinein") {
      if (shared.occasion === "date") lines.push("Occasion: date night");
      if (shared.dress !== "either") lines.push(`Dress: ${shared.dress === "dressed" ? "dressed up" : "sweatpants casual"}`);
    }
  }
  if (shared.venue === "restaurant" && shared.speed !== "either") {
    lines.push(`Pace: ${shared.speed === "quick" ? "in and out, fast" : "no rush, relaxed"}`);
  }
  lines.push(`Budget per person: ${labelFor("budget", shared.budget)}`);
  if (shared.venue !== "describe" && shared.extra.trim()) lines.push(`Extra notes: "${shared.extra.trim()}"`);
  people.forEach((p, i) => {
    const parts = person(p, shared.venue);
    if (parts.length > 0) lines.push(`${people.length > 1 ? `Person ${i + 1}` : "Person"}: ${parts.join("; ")}`);
  });
  return lines.join("\n");
}
