import type { Restaurant } from "./types";

interface Snapshot {
  round: (Restaurant | null)[];
  winners: Restaurant[];
  match: number;
}

export interface Bracket {
  /**
   * Contenders in the current round, in match order: [0] vs [1], [2] vs [3], ...
   * A null is a bye (an empty slot); its opponent advances automatically.
   */
  round: (Restaurant | null)[];
  /** Winners of this round's matches so far */
  winners: Restaurant[];
  /** Index of the match being decided */
  match: number;
  champion: Restaurant | null;
  history: Snapshot[];
  /** Number of real matches from the first round to the final, for a progress bar */
  totalMatches: number;
}

/** Standard seeding order so top seeds can't meet until late: n=8 gives 1v8, 4v5, 2v7, 3v6. */
function seedOrder(n: number): number[] {
  let order = [1];
  while (order.length < n) {
    const m = order.length * 2;
    order = order.flatMap((s) => [s, m + 1 - s]);
  }
  return order;
}

/** Move one match forward. Real picks are recorded for undo; byes are not. */
function advance(b: Bracket, winner: Restaurant, record: boolean): Bracket {
  const winners = [...b.winners, winner];
  const history = record ? [...b.history, { round: b.round, winners: b.winners, match: b.match }] : b.history;

  if ((b.match + 1) * 2 < b.round.length) return { ...b, winners, match: b.match + 1, history };
  if (winners.length === 1) return { ...b, winners, champion: winner, history };
  return { ...b, round: winners, winners: [], match: 0, history };
}

/** Skip over any matches that have an empty slot (byes) until a real match is up. */
function settle(b: Bracket): Bracket {
  let cur = b;
  while (!cur.champion) {
    const a = cur.round[cur.match * 2];
    const c = cur.round[cur.match * 2 + 1];
    if (a && c) break;
    cur = advance(cur, (a ?? c) as Restaurant, false);
  }
  return cur;
}

/**
 * Build a bracket from restaurants sorted best-first. Any number works: the bracket is rounded up to
 * the next power of two and the top seeds get byes in the first round.
 */
export function createBracket(sorted: Restaurant[]): Bracket {
  const n = sorted.length;
  if (n <= 1) {
    return { round: sorted, winners: [], match: 0, champion: sorted[0] ?? null, history: [], totalMatches: 0 };
  }
  const size = 2 ** Math.ceil(Math.log2(n));
  const round = seedOrder(size).map((seed) => sorted[seed - 1] ?? null);
  return settle({ round, winners: [], match: 0, champion: null, history: [], totalMatches: n - 1 });
}

export function pickWinner(b: Bracket, side: 0 | 1): Bracket {
  const winner = b.round[b.match * 2 + side];
  if (!winner) return b;
  return settle(advance(b, winner, true));
}

export function undoPick(b: Bracket): Bracket {
  const last = b.history[b.history.length - 1];
  if (!last) return b;
  return { ...b, ...last, champion: null, history: b.history.slice(0, -1) };
}

export function roundName(size: number): string {
  if (size === 2) return "Final";
  if (size === 4) return "Semifinals";
  if (size === 8) return "Quarterfinals";
  return `Round of ${size}`;
}
