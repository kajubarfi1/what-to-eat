import { defaultWhenAt } from "./hours";
import type { Meal, PersonAnswers, SharedAnswers, Venue } from "./types";

function guessMeal(): Meal {
  const h = new Date().getHours();
  return h < 11 ? "breakfast" : h < 16 ? "lunch" : "dinner";
}

/** Fresh defaults; the meal is guessed from the time of day. */
export function defaultShared(): SharedAnswers {
  return {
    venue: "restaurant",
    description: "",
    when: "now",
    whenAt: defaultWhenAt(),
    meal: guessMeal(),
    speed: "either",
    dress: "either",
    service: "dinein",
    budget: "10to20",
    occasion: "casual",
    travelMode: "drive",
    maxTravelMin: 15,
    eatingAt: "home",
    extra: "",
  };
}

export const EMPTY_PERSON: PersonAnswers = {
  hunger: 3,
  weight: "either",
  adventure: "either",
  textures: [],
  temperature: "either",
  mess: "either",
  recent: [],
  hardNos: [],
  duelPicks: [],
  lastGreatMeal: "",
  dietary: [],
  styles: [],
  vibe: "",
};

interface Option {
  value: string;
  label: string;
  /** doodle icon name (see components/Doodle.tsx) */
  icon?: string;
}

export type Service = SharedAnswers["service"];

interface Base {
  field: string;
  title: string;
  hint?: string;
  /** Only ask when the chosen service is one of these (default: all). */
  services?: Service[];
  /** Only ask for these kinds of place (default: all). */
  venues?: Venue[];
  /** Only ask when going now / later (default: both). */
  whens?: SharedAnswers["when"][];
  /** Per-service wording overrides. */
  titles?: Partial<Record<Service, string>>;
  hints?: Partial<Record<Service, string>>;
}

/** Bars are always dine-in, so the service question is skipped and treated as dine-in. */
export function normalize(shared: SharedAnswers): SharedAnswers {
  let s = shared;
  if (s.venue === "bar") s = { ...s, service: "dinein" };
  // Going later: breakfast / lunch / dinner follows the chosen time, not the clock now.
  if (s.when === "later" && /^\d{4}-\d{2}-\d{2}T\d{2}:/.test(s.whenAt)) {
    const h = Number(s.whenAt.slice(11, 13));
    s = { ...s, meal: h < 11 ? "breakfast" : h < 16 ? "lunch" : "dinner" };
  }
  return s;
}

/** Resolve the shared steps and wording that apply to the chosen venue and service. */
export function sharedStepsFor(shared: SharedAnswers): Step[] {
  const { service, venue, when } = normalize(shared);
  return SHARED_STEPS.filter(
    (s) =>
      (!s.services || s.services.includes(service)) &&
      (!s.venues || s.venues.includes(venue)) &&
      (!s.whens || s.whens.includes(when)),
  ).map((s) => ({
    ...s,
    title: s.titles?.[service] ?? s.title,
    hint: s.hints?.[service] ?? s.hint,
  }));
}

export type Step =
  | (Base & { kind: "single"; options: Option[] })
  | (Base & { kind: "multi"; options: Option[] })
  | (Base & { kind: "slider"; min: number; max: number; step: number; format: (v: number) => string })
  | (Base & { kind: "cuisines" }) // multi-pick from the cuisine list
  | (Base & { kind: "duels" })
  | (Base & { kind: "styles" }) // multi-pick from the venue's styles (bar / coffee / dessert)
  | (Base & { kind: "datetime" })
  | (Base & { kind: "text"; placeholder: string });

/** Asked once, even in "for two" mode. The service question comes first and shapes the rest. */
export const SHARED_STEPS: Step[] = [
  {
    kind: "single", field: "venue", title: "What are you looking for?",
    options: [
      { value: "restaurant", label: "Restaurant", icon: "plate" },
      { value: "bar", label: "Bar", icon: "cocktail" },
      { value: "coffee", label: "Coffee shop", icon: "coffee" },
      { value: "dessert", label: "Dessert place", icon: "cake" },
      { value: "describe", label: "Describe it", icon: "sparkle" },
    ],
  },
  {
    kind: "text", field: "description", venues: ["describe"],
    title: "Describe what you're looking for",
    hint: "Tell us in your own words: the food, the mood, the weather, anything. Claude will turn it into searches.",
    placeholder: "e.g. something warm and comforting, it's pouring rain",
  },
  {
    kind: "single", field: "when", title: "Is this for now or later?",
    options: [
      { value: "now", label: "Right now", icon: "bolt" },
      { value: "later", label: "Later", icon: "clock" },
    ],
  },
  {
    kind: "datetime", field: "whenAt", whens: ["later"],
    title: "When are you going?",
    hint: "Pick the date and time. We'll only suggest places that are open then.",
  },
  {
    kind: "single", field: "service", venues: ["restaurant", "coffee", "dessert", "describe"],
    title: "Dine in, takeout, or delivery?",
    options: [
      { value: "dinein", label: "Dine in", icon: "plate" },
      { value: "takeout", label: "Takeout", icon: "bag" },
      { value: "delivery", label: "Delivery", icon: "scooter" },
    ],
  },

  // --- dine in ---
  {
    kind: "single", field: "speed", services: ["dinein", "takeout"], venues: ["restaurant"],
    title: "In and out, or a long sit-down?",
    titles: { takeout: "Need it fast, or fine to wait for it made fresh?" },
    options: [
      { value: "quick", label: "Fast", icon: "bolt" },
      { value: "sitdown", label: "No rush", icon: "candle" },
      { value: "either", label: "Either" },
    ],
  },
  {
    kind: "single", field: "dress", services: ["dinein"], venues: ["restaurant", "bar"], title: "Dressed up, or sweatpants?",
    options: [
      { value: "sweats", label: "Sweatpants" },
      { value: "dressed", label: "Dressed up" },
      { value: "either", label: "Either" },
    ],
  },
  {
    kind: "single", field: "occasion", services: ["dinein"], venues: ["restaurant", "bar"], title: "Just dinner, or a date night?",
    options: [
      { value: "casual", label: "Just a meal" },
      { value: "date", label: "Date night", icon: "heart" },
    ],
  },

  // --- takeout ---
  {
    kind: "single", field: "eatingAt", services: ["takeout"], venues: ["restaurant"], title: "Eating it at home, or on the go?",
    hint: "On the go favors food that's easy to eat without a table (fewer soups and fork-and-knife meals).",
    options: [
      { value: "home", label: "At home", icon: "house" },
      { value: "onthego", label: "On the go", icon: "car" },
    ],
  },

  // --- all services, worded per service ---
  {
    kind: "single", field: "budget",
    title: "What is your budget per person?",
    titles: { delivery: "What is your budget per person? (before delivery fees)" },
    hint: "Roughly what you'd like to spend on the food itself.",
    options: [
      { value: "under10", label: "Under $10" },
      { value: "10to20", label: "$10 - $20" },
      { value: "20to30", label: "$20 - $30" },
      { value: "30plus", label: "$30+" },
    ],
  },
  {
    kind: "single", field: "travelMode", services: ["dinein", "takeout"],
    title: "How are you getting there?",
    options: [
      { value: "walk", label: "Walking", icon: "walk" },
      { value: "bike", label: "Biking", icon: "bike" },
      { value: "drive", label: "Driving", icon: "car" },
    ],
  },
  {
    kind: "slider", field: "maxTravelMin",
    title: "How long are you willing to travel?",
    titles: {
      takeout: "How long are you willing to travel to pick it up?",
      delivery: "How many minutes away can the restaurant be?",
    },
    hints: {
      dinein: "Times are estimates.",
      takeout: "Times are estimates.",
      delivery: "Farther usually means longer delivery times and colder food. Times are estimates.",
    },
    min: 3, max: 45, step: 1, format: (v) => `${v} min`,
  },
];

/** Always the very last question, after everyone has answered. */
export const FINAL_STEP: Step = {
  kind: "text", field: "extra", title: "Anything else? (optional)",
  hint: "e.g. “something warm and comforting, it's raining.” Added to the search.",
  placeholder: "Describe the craving…",
};

/** Human-readable label for a chosen option (leading emoji stripped), for summaries. */
export function labelFor(field: string, value: string): string {
  for (const step of SHARED_STEPS) {
    if (step.field === field && step.kind === "single") {
      const label = step.options.find((o) => o.value === value)?.label ?? value;
      return label.replace(/^[^\p{L}\p{N}$]+/u, "");
    }
  }
  return value;
}

const DIETARY_STEP: Step = {
  kind: "multi", field: "dietary", title: "Anything you're avoiding right now?",
  hint: "Dietary needs, gym, cutting, allergies. Pick any.",
  options: [], // filled from DIETARY in the UI
};

/** Asked per person (restaurants). */
export const PERSON_STEPS: Step[] = [
  {
    kind: "slider", field: "hunger", title: "How hungry are you?",
    min: 1, max: 5, step: 1,
    format: (v) => ["", "Just a snack", "Kinda hungry", "Hungry", "Very hungry", "Starving"][v],
  },
  {
    kind: "single", field: "weight", title: "How do you want to feel after the meal?",
    options: [
      { value: "heavy", label: "Full and cozy" },
      { value: "light", label: "Light and energized" },
      { value: "either", label: "No preference" },
    ],
  },
  {
    kind: "multi", field: "textures", title: "Which textures sound good?",
    hint: "Pick any.",
    options: [
      { value: "crispy", label: "Crispy" },
      { value: "saucy", label: "Saucy" },
      { value: "soupy", label: "Soupy" },
      { value: "fresh", label: "Fresh & crunchy" },
      { value: "creamy", label: "Creamy" },
      { value: "chewy", label: "Chewy" },
      { value: "tender", label: "Tender & juicy" },
      { value: "gooey", label: "Cheesy & gooey" },
    ],
  },
  {
    kind: "single", field: "temperature", title: "Hot and comforting, or cold and refreshing?",
    options: [
      { value: "hot", label: "Hot and comforting", icon: "flame" },
      { value: "cold", label: "Cold and refreshing", icon: "snow" },
      { value: "either", label: "Either" },
    ],
  },
  {
    kind: "single", field: "mess", title: "How messy is it okay to be?",
    options: [
      { value: "tidy", label: "Keep it tidy" },
      { value: "some", label: "A little mess is fine" },
      { value: "messy", label: "Bring on the napkins" },
      { value: "either", label: "No preference" },
    ],
  },
  {
    kind: "cuisines", field: "recent", title: "What did you have yesterday and the day before?",
    hint: "So we don't repeat it. Skip if nothing fits.",
  },
  {
    kind: "cuisines", field: "hardNos", title: "Any hard no's today?",
    hint: "These are excluded completely.",
  },
  DIETARY_STEP,
];

const NO_PREFERENCE = { value: "", label: "No preference" };

const STYLE_AND_VIBE: Record<"bar" | "coffee" | "dessert", Step[]> = {
  bar: [
    { kind: "styles", field: "styles", title: "What kind of bar?", hint: "Pick any." },
    {
      kind: "single", field: "vibe", title: "What's the vibe?",
      options: [
        { value: "chill", label: "Chill", icon: "couch" },
        { value: "lively", label: "Lively", icon: "party" },
        { value: "upscale", label: "Upscale", icon: "wine" },
        NO_PREFERENCE,
      ],
    },
  ],
  coffee: [
    { kind: "styles", field: "styles", title: "What are you in the mood for?", hint: "Pick any." },
    {
      kind: "single", field: "vibe", title: "What will you be doing there?",
      options: [
        { value: "work", label: "Working or studying", icon: "laptop" },
        { value: "catchup", label: "Catching up", icon: "chat" },
        { value: "togo", label: "Grab and go", icon: "run" },
        NO_PREFERENCE,
      ],
    },
  ],
  dessert: [{ kind: "styles", field: "styles", title: "What sounds good?", hint: "Pick any." }],
};

/** Per-person questions depend on the kind of place. */
export function personStepsFor(venue: Venue): Step[] {
  if (venue === "restaurant") return PERSON_STEPS;
  if (venue === "describe") return [DIETARY_STEP];
  return STYLE_AND_VIBE[venue];
}
