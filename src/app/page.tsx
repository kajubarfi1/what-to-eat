"use client";

import { useMemo, useState } from "react";
import { Doodle } from "@/components/Doodle";
import { CUISINES, CUISINE_BY_KEY, DIETARY, DUELS } from "@/lib/cuisines";
import { createBracket, pickWinner, roundName, undoPick, type Bracket } from "@/lib/bracket";
import { rankCuisines, rankStyles } from "@/lib/scoring";
import { formatWhen, toLocalInputValue } from "@/lib/hours";
import { describeAnswers } from "@/lib/summary";
import { isStyleVenue, STYLES } from "@/lib/venues";
import {
  defaultShared,
  EMPTY_PERSON,
  FINAL_STEP,
  labelFor,
  normalize,
  personStepsFor,
  sharedStepsFor,
  type Step,
} from "@/lib/steps";
import type { PersonAnswers, Restaurant, SharedAnswers, Venue } from "@/lib/types";

type Mode = "solo" | "two";
type Item = { who: "shared" | 0 | 1; step: Step } | { who: "handoff" };
type Stage = "mode" | "questions" | "processing" | "bracket";
type Phase = "locating" | "searching" | "seeding";

/** The browser couldn't (or wouldn't) say where the device is. The screen offers typing a location instead. */
class LocationError extends Error {}

type Coords = { lat: number; lng: number };

function getPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new LocationError("This browser can't share your location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        reject(
          new LocationError(
            err.code === 1
              ? "Location access is blocked for this site."
              : err.code === 3
                ? "Finding your location took too long."
                : "We couldn't work out where you are.",
          ),
        ),
      // Without a timeout, some phones never answer and the screen would wait forever.
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("mode");
  const [mode, setMode] = useState<Mode>("solo");
  const [index, setIndex] = useState(0);
  const [shared, setShared] = useState<SharedAnswers>(defaultShared);
  const [people, setPeople] = useState<PersonAnswers[]>([EMPTY_PERSON, EMPTY_PERSON]);
  const [phase, setPhase] = useState<Phase>("locating");
  const [error, setError] = useState<string | null>(null);
  const [needLocation, setNeedLocation] = useState(false);
  const [manualLoc, setManualLoc] = useState<Coords | null>(null);
  const [address, setAddress] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [topDirections, setTopDirections] = useState<string[]>([]);
  const [results, setResults] = useState<Restaurant[]>([]);
  const [bracket, setBracket] = useState<Bracket | null>(null);

  const norm = useMemo(() => normalize(shared), [shared]);

  // A new key remounts <main key={screenKey}>, which replays the fade-in on every screen (and every bracket match).
  const screenKey =
    stage === "questions"
      ? `q${index}`
      : stage === "bracket" && bracket
        ? `b${bracket.history.length}${bracket.champion ? "w" : ""}`
        : stage;

  const sequence = useMemo<Item[]>(() => {
    const personSteps = personStepsFor(shared.venue);
    const s: Item[] = sharedStepsFor(shared).map((step): Item => ({ who: "shared", step }));
    s.push(...personSteps.map((step): Item => ({ who: 0, step })));
    if (mode === "two") {
      s.push({ who: "handoff" });
      s.push(...personSteps.map((step): Item => ({ who: 1, step })));
    }
    // "Describe it" already is the free-text question, so it doesn't need a closing one.
    if (shared.venue !== "describe") s.push({ who: "shared", step: FINAL_STEP });
    return s;
  }, [mode, shared]);

  const activePeople = mode === "two" ? people : people.slice(0, 1);
  const ranked = useMemo(
    () => (shared.venue === "restaurant" ? rankCuisines(activePeople, norm) : []),
    [activePeople, norm, shared.venue],
  );
  const dietary = [...new Set(activePeople.flatMap((p) => p.dietary))];
  const vibes = [...new Set(activePeople.map((p) => p.vibe).filter(Boolean))];

  /** The keys we'll search: top cuisines, or the picked bar / coffee / dessert styles. */
  function pickDirections(): string[] {
    if (shared.venue === "restaurant") return ranked.slice(0, 3).map((r) => r.key);
    if (isStyleVenue(shared.venue)) return rankStyles(shared.venue, activePeople);
    return []; // "describe": Claude decides
  }

  function start(m: Mode) {
    setMode(m);
    setIndex(0);
    setStage("questions");
  }

  function next() {
    if (index + 1 >= sequence.length) void runSearch();
    else setIndex(index + 1);
  }

  function back() {
    if (index === 0) setStage("mode");
    else setIndex(index - 1);
  }

  function setPersonField(who: 0 | 1, field: string, value: unknown) {
    setPeople((cur) => cur.map((p, i) => (i === who ? { ...p, [field]: value } : p)));
  }

  /** Processing screen: score cuisines, search Google, then seed the bracket. */
  async function runSearch(override?: Coords) {
    const directions = pickDirections();
    setTopDirections(directions);
    setError(null);
    setNeedLocation(false);
    setPhase("locating");
    setStage("processing");

    if (shared.venue === "describe" && !shared.description.trim()) {
      setError("Tell us what you're looking for first. Go back and add a description.");
      return;
    }
    if (shared.venue === "restaurant" && directions.length === 0) {
      setError("Every cuisine was ruled out by your hard no's. Go back and loosen them.");
      return;
    }

    try {
      const location = override ?? manualLoc ?? (await getPosition());
      setPhase("searching");
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: describeAnswers(norm, activePeople),
          directions,
          vibes,
          shared: norm,
          dietary,
          location,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");

      const found: Restaurant[] = data.results;
      if (found.length === 0) {
        throw new Error(
          shared.when === "now"
            ? "Nothing matching is open right now. Try choosing \"Later\" and picking a time, or loosen your answers."
            : "No matches for that time. Try a different time, a longer travel time, a higher budget, or fewer hard no's.",
        );
      }
      setPhase("seeding");
      await new Promise((r) => setTimeout(r, 800)); // brief beat so the last step is visible
      setResults(found);
      setBracket(createBracket(found));
      setStage("bracket");
    } catch (e) {
      if (e instanceof LocationError) setNeedLocation(true);
      setError(errorMessage(e));
    }
  }

  /** Fallback when the device location isn't available: look up what the person typed. */
  async function useTypedLocation() {
    setLookingUp(true);
    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't look that up.");
      const loc = { lat: data.lat, lng: data.lng };
      setManualLoc(loc);
      await runSearch(loc);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLookingUp(false);
    }
  }

  function restart() {
    setStage("mode");
    setShared(defaultShared());
    setPeople([EMPTY_PERSON, EMPTY_PERSON]);
    setResults([]);
    setBracket(null);
    setError(null);
    setNeedLocation(false);
    setManualLoc(null);
    setAddress("");
  }

  // ---------- screens ----------

  if (stage === "mode") {
    return (
      <main key={screenKey} className="hero">
        <Doodle name="onigiri" size={104} className="mascot" />
        <h1>What should we eat today?</h1>
        <div className="food-row" aria-hidden="true">
          {["pizza", "sushi", "tacos", "ramen", "donuts"].map((name) => (
            <Doodle key={name} name={name} />
          ))}
        </div>
        <button className="go" onClick={() => start("solo")}>Let&apos;s go</button>
      </main>
    );
  }

  if (stage === "questions") {
    const item = sequence[index];
    const progress = ((index + 1) / sequence.length) * 100;

    if (item.who === "handoff") {
      return (
        <main key={screenKey}>
          <Progress pct={progress} />
          <Doodle name="phone" size={72} className="mascot" />
          <h1>Pass the phone!</h1>
          <p className="sub">Person 1 is all done. Hand it over to Person 2 and answer for yourself, no peeking!</p>
          <Nav onBack={back} onNext={next} nextLabel="I'm ready" />
        </main>
      );
    }

    const who = item.who;
    const value =
      who === "shared"
        ? (shared as unknown as Record<string, unknown>)[item.step.field]
        : (people[who] as unknown as Record<string, unknown>)[item.step.field];
    const onChange = (v: unknown) =>
      who === "shared" ? setShared((s) => ({ ...s, [item.step.field]: v })) : setPersonField(who, item.step.field, v);

    return (
      <main key={screenKey}>
        <Progress pct={progress} />
        <h1>{item.step.title}</h1>
        {item.step.hint && <p className="sub">{item.step.hint}</p>}
        <StepView step={item.step} value={value} onChange={onChange} venue={shared.venue} />
        <Nav
          onBack={back}
          onNext={next}
          nextLabel={index + 1 >= sequence.length ? "Build my bracket" : "Next"}
          nextDisabled={item.step.kind === "datetime" && !(typeof value === "string" && value >= toLocalInputValue(new Date()))}
        />
      </main>
    );
  }

  if (stage === "processing") {
    const steps: { key: Phase; label: string }[] = [
      { key: "locating", label: "Finding where you are" },
      {
        key: "searching",
        label: shared.venue === "describe" ? "Reading your description and searching" : "Searching nearby spots",
      },
      { key: "seeding", label: "Checking the vibes and seeding your bracket" },
    ];
    const current = steps.findIndex((s) => s.key === phase);
    const directionLabels = topDirections.map((k) =>
      isStyleVenue(shared.venue)
        ? (STYLES[shared.venue].find((d) => d.key === k)?.label ?? k)
        : (CUISINE_BY_KEY[k]?.label ?? k),
    );
    const summary = [
      `Looking for: ${labelFor("venue", shared.venue)}`,
      shared.when === "later" ? `When: ${formatWhen(shared.whenAt)}` : "When: right now",
      directionLabels.length > 0 && `Craving: ${directionLabels.join(", ")}`,
      shared.venue === "describe" && shared.description.trim() && `“${shared.description.trim()}”`,
      shared.venue !== "bar" && `${labelFor("service", norm.service)}`,
      `Budget: ${labelFor("budget", shared.budget)} per person · up to ${shared.maxTravelMin} min` +
        (norm.service === "delivery" ? " away" : ` (${labelFor("travelMode", shared.travelMode).toLowerCase()})`),
      vibes.length > 0 && `Vibe: ${vibes.join(", ")}`,
      dietary.length > 0 && `Dietary: ${dietary.join(", ")}`,
      shared.venue !== "describe" && shared.extra.trim() && `Notes: “${shared.extra.trim()}”`,
    ].filter(Boolean) as string[];

    return (
      <main key={screenKey}>
        <Doodle name={error ? "sad" : "pan"} size={72} className="mascot" />
        <h1>{error ? "Oh no, that didn't work" : "Cooking up your bracket…"}</h1>
        {!error && <p className="sub">Putting your answers together.</p>}

        <ul className="summary">
          {summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        {error ? (
          <>
            <div className="error">{error}</div>
            {needLocation && (
              <div className="locate">
                <label htmlFor="address">Or type where you are</label>
                <input
                  id="address"
                  className="datetime"
                  placeholder="Neighborhood, ZIP code or address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && address.trim() && void useTypedLocation()}
                />
                <button className="go" onClick={() => void useTypedLocation()} disabled={lookingUp || address.trim().length < 3}>
                  {lookingUp ? "Looking it up…" : "Search from here"}
                </button>
                <p className="meta">
                  To use your real location instead: iPhone Settings, then Privacy &amp; Security, then Location Services,
                  and set your browser to &quot;While Using the App&quot;. Then tap Try again.
                </p>
              </div>
            )}
            <button className={needLocation ? "go alt" : "go"} onClick={() => void runSearch()}>Try again</button>
            <button className="go alt" onClick={() => { setIndex(sequence.length - 1); setStage("questions"); }}>
              ← Back to questions
            </button>
          </>
        ) : (
          <ul className="phases">
            {steps.map((s, i) => (
              <li key={s.key} className={i < current ? "done" : i === current ? "active" : ""}>
                <span className="dot">{i < current ? "✓" : i === current ? <span className="spinner" /> : ""}</span>
                {s.label}
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  }

  // ---------- bracket ----------
  if (!bracket) return null;

  if (bracket.champion) {
    const w = bracket.champion;
    return (
      <main key={screenKey}>
        <Doodle name="trophy" size={72} className="mascot" />
        <span className="tag">We have a winner!</span>
        <h1>{w.name}</h1>
        <div className="champion">
          <RestaurantPhoto r={w} />
          <RestaurantInfo r={w} />
          {w.mapsUrl && (
            <a className="go linklike" href={w.mapsUrl} target="_blank" rel="noreferrer">
              Open in Maps
            </a>
          )}
        </div>
        {bracket.history.length > 0 && (
          <button className="go alt" onClick={() => setBracket(undoPick(bracket))}>← Undo last pick</button>
        )}
        <button className="go alt" onClick={() => setBracket(createBracket(results))}>Run the bracket again</button>
        <button className="go alt" onClick={restart}>Start over</button>
      </main>
    );
  }

  const a = bracket.round[bracket.match * 2];
  const b = bracket.round[bracket.match * 2 + 1];
  if (!a || !b) return null; // byes are skipped automatically, so this only guards the types
  const matchesInRound = bracket.round.length / 2;

  return (
    <main key={screenKey}>
      <Progress pct={(bracket.history.length / bracket.totalMatches) * 100} />
      <span className="tag">
        {roundName(bracket.round.length)} · Match {bracket.match + 1} of {matchesInRound}
      </span>
      <h1>Choose one from the two</h1>
      <div className="matchup">
        <Contender r={a} onPick={() => setBracket(pickWinner(bracket, 0))} />
        <div className="vs">vs</div>
        <Contender r={b} onPick={() => setBracket(pickWinner(bracket, 1))} />
      </div>
      <div className="nav">
        <button className="back" onClick={() => setBracket(undoPick(bracket))} disabled={bracket.history.length === 0}>
          ← Undo
        </button>
        <button className="back" onClick={restart}>Start over</button>
      </div>
    </main>
  );
}

// ---------- pieces ----------

function RestaurantPhoto({ r }: { r: Restaurant }) {
  if (!r.photoUrl) return null;
  return (
    <figure className="photo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={r.photoUrl} alt={`Inside ${r.name}`} />
      {r.photoCredit && (
        <figcaption>
          Photo:{" "}
          {r.photoCredit.uri ? (
            <a href={r.photoCredit.uri} target="_blank" rel="noreferrer">{r.photoCredit.name}</a>
          ) : (
            r.photoCredit.name
          )}
        </figcaption>
      )}
    </figure>
  );
}

function RestaurantInfo({ r }: { r: Restaurant }) {
  return (
    <>
      {r.vibe && <p className="vibe">{r.vibe}</p>}
      {r.why && <p className="why">{r.why}</p>}
      <div className="meta">
        ★ {r.rating.toFixed(1)} ({r.reviewCount.toLocaleString()}) ·{" "}
        {r.priceLevel ? "$".repeat(r.priceLevel) : "price n/a"} · ~{r.travelMin} min
      </div>
      <div className="meta">{r.direction}{r.cuisine ? ` · ${r.cuisine}` : ""}</div>
      <div className="meta">{r.address}</div>
      {r.hours && <div className="meta">{r.hours}</div>}
    </>
  );
}

function Contender({ r, onPick }: { r: Restaurant; onPick: () => void }) {
  return (
    <div className="contender">
      <RestaurantPhoto r={r} />
      <h3>
        {r.name}
        {r.trustedPick && <span className="badge">trusted pick</span>}
      </h3>
      <RestaurantInfo r={r} />
      {r.mapsUrl && (
        <a href={r.mapsUrl} target="_blank" rel="noreferrer" className="meta-link">
          Open in Maps
        </a>
      )}
      <button className="go" onClick={onPick}>Pick this one</button>
    </div>
  );
}

function Progress({ pct }: { pct: number }) {
  return (
    <div className="progress">
      <div style={{ width: `${pct}%` }} />
    </div>
  );
}

function Nav({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="nav">
      <button className="back" onClick={onBack}>← Back</button>
      <button className="go" onClick={onNext} disabled={nextDisabled}>{nextLabel}</button>
    </div>
  );
}

function StepView({
  step,
  value,
  onChange,
  venue,
}: {
  step: Step;
  value: unknown;
  onChange: (v: unknown) => void;
  venue: Venue;
}) {
  switch (step.kind) {
    case "single":
      return (
        <div className="chips">
          {step.options.map((o) => (
            <button key={o.value} className={`chip big ${value === o.value ? "on" : ""}`} onClick={() => onChange(o.value)}>
              {o.icon && <Doodle name={o.icon} />}
              {o.label}
            </button>
          ))}
        </div>
      );

    case "multi": {
      const options =
        step.field === "dietary" ? DIETARY.map((d) => ({ value: d.value, label: d.label })) : step.options;
      const sel = value as string[];
      return (
        <div className="chips">
          {options.map((o) => (
            <button
              key={o.value}
              className={`chip big ${sel.includes(o.value) ? "on" : ""}`}
              onClick={() => onChange(sel.includes(o.value) ? sel.filter((x) => x !== o.value) : [...sel, o.value])}
            >
              {o.label}
            </button>
          ))}
        </div>
      );
    }

    case "slider": {
      const v = value as number;
      return (
        <>
          <input type="range" min={step.min} max={step.max} step={step.step} value={v} onChange={(e) => onChange(+e.target.value)} />
          <div className="meta big-text">{step.format(v)}</div>
        </>
      );
    }

    case "cuisines": {
      const sel = value as string[];
      return (
        <div className="chips">
          {CUISINES.map((c) => (
            <button
              key={c.key}
              className={`chip ${sel.includes(c.key) ? "on" : ""}`}
              onClick={() => onChange(sel.includes(c.key) ? sel.filter((x) => x !== c.key) : [...sel, c.key])}
            >
              <Doodle name={c.key} /> {c.label}
            </button>
          ))}
        </div>
      );
    }

    case "styles": {
      if (!isStyleVenue(venue)) return null;
      const sel = value as string[];
      return (
        <div className="chips">
          {STYLES[venue].map((d) => (
            <button
              key={d.key}
              className={`chip big ${sel.includes(d.key) ? "on" : ""}`}
              onClick={() => onChange(sel.includes(d.key) ? sel.filter((x) => x !== d.key) : [...sel, d.key])}
            >
              <Doodle name={d.key} /> {d.label}
            </button>
          ))}
        </div>
      );
    }

    case "duels": {
      const picks = value as string[];
      return (
        <>
          {DUELS.map(([a, b]) => {
            const set = (winner: string | null) => {
              const rest = picks.filter((k) => k !== a && k !== b);
              onChange(winner ? [...rest, winner] : rest);
            };
            return (
              <div className="duel" key={a + b}>
                {[a, b].map((k) => (
                  <button
                    key={k}
                    className={`chip big ${picks.includes(k) ? "on" : ""}`}
                    onClick={() => set(picks.includes(k) ? null : k)}
                  >
                    <Doodle name={k} /> {CUISINE_BY_KEY[k].label}
                  </button>
                ))}
              </div>
            );
          })}
        </>
      );
    }

    case "datetime": {
      const v = value as string;
      const past = !v || v < toLocalInputValue(new Date());
      return (
        <>
          <input
            type="datetime-local"
            className="datetime"
            value={v}
            min={toLocalInputValue(new Date())}
            onChange={(e) => onChange(e.target.value)}
          />
          {v && !past && <div className="meta big-text">{formatWhen(v)}</div>}
          {past && <div className="meta">Pick a time in the future to continue.</div>}
        </>
      );
    }

    case "text":
      return (
        <textarea rows={3} placeholder={step.placeholder} value={value as string} onChange={(e) => onChange(e.target.value)} />
      );
  }
}
