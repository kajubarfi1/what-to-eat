import type { SharedAnswers } from "./types";

type Mode = SharedAnswers["travelMode"];

/**
 * Rough door-to-door speeds in straight-line miles per hour. These are lower than real
 * speeds on purpose: roads aren't straight, and driving includes lights and parking.
 * (Swap in the Routes API for exact times later.)
 */
const SPEED_MPH: Record<Mode, number> = { walk: 2.5, bike: 8, drive: 18 };

/** Delivery is always a drive, whatever mode was picked earlier. */
export function effectiveMode(shared: SharedAnswers): Mode {
  return shared.service === "delivery" ? "drive" : shared.travelMode;
}

export function maxMiles(shared: SharedAnswers): number {
  return (shared.maxTravelMin / 60) * SPEED_MPH[effectiveMode(shared)];
}

export function estimateMinutes(miles: number, shared: SharedAnswers): number {
  return Math.max(1, Math.round((miles / SPEED_MPH[effectiveMode(shared)]) * 60));
}
