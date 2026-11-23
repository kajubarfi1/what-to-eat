import { NextResponse } from "next/server";
import { CUISINE_BY_KEY } from "@/lib/cuisines";
import { pickAndDescribe } from "@/lib/enrich";
import { parseWhen } from "@/lib/hours";
import { interpretDescription } from "@/lib/interpret";
import { searchPlaces } from "@/lib/places";
import { rankPlaces } from "@/lib/ranking";
import type { RecommendRequest, Venue } from "@/lib/types";
import { directionsFor, isStyleVenue } from "@/lib/venues";

const VENUES: Venue[] = ["restaurant", "bar", "coffee", "dessert", "describe"];

interface Search {
  label: string;
  query: string;
  placeType?: string;
}

export async function POST(req: Request) {
  let body: RecommendRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const shared = body?.shared;
  if (
    !shared ||
    !VENUES.includes(shared.venue) ||
    !["now", "later"].includes(shared.when) ||
    (shared.when === "later" && !parseWhen(shared.whenAt)) ||
    !(shared.maxTravelMin > 0) ||
    !["walk", "bike", "drive"].includes(shared.travelMode) ||
    typeof shared.extra !== "string" ||
    typeof shared.description !== "string" ||
    typeof body.profile !== "string" ||
    !Array.isArray(body.dietary) ||
    !Array.isArray(body.directions) ||
    !Array.isArray(body.vibes) ||
    typeof body.location?.lat !== "number" ||
    typeof body.location?.lng !== "number"
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    let searches: Search[] = [];
    let dietary = body.dietary;

    if (shared.venue === "describe") {
      const description = shared.description.trim().slice(0, 500);
      if (!description) {
        return NextResponse.json({ error: "Describe what you're looking for first." }, { status: 400 });
      }
      const interpreted = await interpretDescription(description);
      searches = interpreted.searches;
      dietary = [...new Set([...dietary, ...interpreted.dietary])];
    } else if (shared.venue === "restaurant") {
      searches = body.directions
        .filter((k) => k in CUISINE_BY_KEY)
        .slice(0, 3)
        .map((k) => ({ label: CUISINE_BY_KEY[k].label, query: CUISINE_BY_KEY[k].query, placeType: CUISINE_BY_KEY[k].placeType }));
    } else if (isStyleVenue(shared.venue)) {
      searches = directionsFor(shared.venue, body.directions)
        .slice(0, 3)
        .map((d) => ({ label: d.label, query: d.query, placeType: d.placeType }));
    }

    if (searches.length === 0) {
      return NextResponse.json({ error: "Nothing to search for. Go back and pick something." }, { status: 400 });
    }

    const clean: RecommendRequest = { ...body, dietary, profile: body.profile.slice(0, 2000) };
    const groups = await Promise.all(
      searches.map(async (s, directionIndex) => ({
        label: s.label,
        directionIndex,
        places: await searchPlaces(s.query, clean, s.placeType),
      })),
    );
    const ranked = rankPlaces(groups, clean);
    const raw = new Map(groups.flatMap((g) => g.places.map((p) => [p.id, p] as const)));
    return NextResponse.json({ results: await pickAndDescribe(ranked, raw, clean.profile) });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 },
    );
  }
}
