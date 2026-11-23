# What should I eat?

Answer a few questions (hunger, vibe, price, distance), get the best-rated nearby restaurants.

## Setup
1. Install Node.js 20+ (https://nodejs.org, LTS).
2. `npm install` then `npm install @anthropic-ai/sdk` (the AI SDK, for the "Describe it" option)
3. `cp .env.example .env.local` and add your `GOOGLE_PLACES_API_KEY` (and `ANTHROPIC_API_KEY` for the "Describe it" option) (enable **Places API (New)** in Google Cloud, set a budget alert).
4. `npm run dev` and open http://localhost:3000

## How it works
1. **Questions** (`src/lib/steps.ts`): the first is "What are you looking for?" (restaurant, bar, coffee shop, dessert place, or describe it). Then "Is this for now or later?" (later asks for a date and time, and only places open then are suggested), and shared questions asked once (dine in/takeout, speed, dress, occasion, budget, travel mode and time, with some only for certain venues) and per-person ones. Restaurants get the full set (hunger, how you want to feel, textures, temperature, how messy, recent meals, hard no's, dietary); bars and coffee shops get a style pick plus a vibe; dessert places get a style pick; "Describe it" asks you to describe it, then dietary. A free-text "anything else?" comes last (not for "Describe it"). "For two" mode is pass-and-play.
2. **Scoring** (`src/lib/scoring.ts`): answers score each cuisine in `src/lib/cuisines.ts` (restaurants); bar/coffee/dessert styles in `src/lib/venues.ts` are ranked by how many people picked them. "Describe it" sends your text to Claude (`src/lib/interpret.ts`), which returns up to 3 Google Maps searches. For two people, score = average + half the lower score; any hard no excludes.
3. **Processing screen**: after the last question (the free-text one), the top 3 cuisine directions are searched while a progress screen summarizes your answers.
4. **Search + rank** (`src/app/api/recommend/route.ts`, `places.ts`, `ranking.ts`): Google Places Text Search per direction, then filters (travel time, budget, dine-in/takeout/delivery, vegetarian) and a score (Bayesian rating, distance, price fit, trusted-pick boost).
5. **Bracket** (`src/lib/bracket.ts`): the top 8 results are seeded (1v8, 4v5, 2v7, 3v6) and shown two at a time, quarterfinals to final, until one winner remains. Undo is supported.
6. `data/trusted-picks.json`: manual stand-in for Beli data.

## Next steps
- [ ] Real travel time via Routes API
- [ ] "For two" on separate phones
