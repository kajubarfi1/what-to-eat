import { NextResponse } from "next/server";

/**
 * Turns something a person types ("Northgate, College Station", "77840", a street address) into
 * coordinates, for when the browser won't share the device's location. Uses the same Places
 * text search as everything else, so it needs no extra Google API.
 */
export async function POST(req: Request) {
  let body: { query?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const query = typeof body.query === "string" ? body.query.trim().slice(0, 200) : "";
  if (query.length < 3) {
    return NextResponse.json({ error: "Type a neighborhood, ZIP code or address." }, { status: 400 });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY is not set" }, { status: 500 });

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.location,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery: query, pageSize: 1 }),
  });

  if (res.status === 429) {
    return NextResponse.json({ error: "Google's daily search limit has been reached. Try again later." }, { status: 429 });
  }
  if (!res.ok) return NextResponse.json({ error: "Couldn't look that up. Try again." }, { status: 502 });

  const place = (await res.json()).places?.[0];
  if (!place?.location) {
    return NextResponse.json({ error: "We couldn't find that place. Try a ZIP code or a fuller address." }, { status: 404 });
  }
  return NextResponse.json({
    lat: place.location.latitude,
    lng: place.location.longitude,
    label: place.formattedAddress ?? query,
  });
}
