import type { ReactNode } from "react";

/**
 * Hand-drawn style line icons. Each is drawn on a 48x48 grid; the wobble filter
 * (defined once in layout.tsx) makes the clean strokes look sketched, and the
 * soft blob behind gives them a sticker feel. Colors come from CSS (currentColor + --doodle-blob).
 */

const bowl = <path d="M8 24h32c0 10-7 17-16 17S8 34 8 24z" />;
const bowlBase = <path d="M18 43h12" />;
const steam = <path d="M18 8c-3 3 3 5 0 9M26 8c-3 3 3 5 0 9" />;
const flame = <path d="M24 6c4 7 9 9 7 16-1 4-4 6-7 6s-6-2-7-6c-2-7 3-9 7-16z" />;
const wineGlass = (
  <>
    <path d="M14 6h20c0 12-4 18-10 18S14 18 14 6z" />
    <path d="M24 24v16M16 40h16M15 14h18" />
  </>
);
const cake = (
  <>
    <path d="M6 40V22l36-10v28z" />
    <path d="M6 31l36-10" />
    <circle cx="38" cy="7" r="3" />
  </>
);
const donut = (
  <>
    <circle cx="24" cy="24" r="16" />
    <circle cx="24" cy="24" r="5" />
    <path d="M14 15l3 2M32 13l-2 3M35 28l-3-1M17 34l1-3" />
  </>
);
const cupcake = (
  <>
    <path d="M12 28h24l-4 14H16z" />
    <path d="M10 28c-2-6 2-10 7-9 0-7 14-7 14 0 5-1 9 3 7 9z" />
  </>
);
const strawberry = (
  <>
    <path d="M24 14c10-2 18 4 14 16-3 8-9 12-14 12S13 38 10 30c-4-12 4-18 14-16z" />
    <path d="M16 12c4-2 6 0 8 2 2-2 4-4 8-2M24 8v6" />
    <path d="M18 26h.1M26 24h.1M22 33h.1M30 31h.1" strokeWidth={3.6} />
  </>
);
const ramenBowl = (
  <>
    {bowl}
    {bowlBase}
    <path d="M14 24c3-4 5 0 8-3s5 1 8-2" />
    <circle cx="33" cy="19" r="4" />
  </>
);

const ICONS: Record<string, ReactNode> = {
  // ---- mascots & decoration
  onigiri: (
    <>
      <path d="M24 8c4 0 6 4 12 22 1 5-4 10-12 10S11 35 12 30C18 12 20 8 24 8z" />
      <path d="M17 32h14v8H17z" />
      <path d="M21 20h.1M27 20h.1" strokeWidth={3.6} />
      <path d="M22 25c1.5 1.5 3 1.5 4 0" />
    </>
  ),
  phone: (
    <>
      <rect x="14" y="6" width="20" height="36" rx="4" />
      <path d="M22 36h4M20 12h8" />
    </>
  ),
  pan: (
    <>
      <circle cx="20" cy="26" r="13" />
      <circle cx="20" cy="26" r="5" />
      <path d="M33 26h12" />
    </>
  ),
  sad: (
    <>
      <circle cx="24" cy="24" r="16" />
      <path d="M17 20h.1M31 20h.1" strokeWidth={3.6} />
      <path d="M17 33c4-4 10-4 14 0" />
    </>
  ),
  trophy: (
    <>
      <path d="M14 8h20v12c0 6-4 10-10 10s-10-4-10-10z" />
      <path d="M14 12H6c0 8 3 10 8 10M34 12h8c0 8-3 10-8 10M24 30v8M16 42h16" />
    </>
  ),
  strawberry,
  cupcake,
  donuts: donut,
  sparkle: <path d="M24 6c1 10 4 14 14 18-10 4-13 8-14 18-1-10-4-14-14-18 10-4 13-8 14-18z" />,
  star: <path d="M24 6l5 12 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1z" />,

  // ---- shared options
  plate: (
    <>
      <circle cx="24" cy="24" r="10" />
      <circle cx="24" cy="24" r="4" />
      <path d="M6 8v12c0 2 4 2 4 0V8M8 22v18M42 8c-4 3-4 9-4 14h4zM42 22v18" />
    </>
  ),
  bag: (
    <>
      <path d="M10 16h28l-2 26H12z" />
      <path d="M17 16c0-9 14-9 14 0" />
    </>
  ),
  scooter: (
    <>
      <circle cx="12" cy="36" r="5" />
      <circle cx="38" cy="36" r="5" />
      <path d="M12 36h8l6-16h8M34 20l4 16M20 36l-4-10h-4" />
    </>
  ),
  bolt: <path d="M26 4L12 26h10l-4 18 18-24H26z" />,
  clock: (
    <>
      <circle cx="24" cy="24" r="16" />
      <path d="M24 14v10l7 5" />
    </>
  ),
  candle: (
    <>
      <rect x="18" y="20" width="12" height="22" rx="2" />
      <path d="M24 20v-4M24 6c4 4 4 7 0 10-4-3-4-6 0-10z" />
    </>
  ),
  heart: <path d="M24 40C8 28 6 18 12 13c5-4 10-1 12 4 2-5 7-8 12-4 6 5 4 15-12 27z" />,
  house: <path d="M6 24L24 8l18 16M12 22v20h24V22M20 42V30h8v12" />,
  car: (
    <>
      <path d="M6 32V24l6-10h24l6 10v8z" />
      <path d="M6 24h36" />
      <circle cx="14" cy="34" r="4" />
      <circle cx="34" cy="34" r="4" />
    </>
  ),
  walk: (
    <>
      <circle cx="24" cy="9" r="4" />
      <path d="M24 14v14M24 20l-8 6M24 20l8 6M24 28l-6 14M24 28l6 14" />
    </>
  ),
  bike: (
    <>
      <circle cx="12" cy="32" r="8" />
      <circle cx="36" cy="32" r="8" />
      <path d="M12 32l8-16h10M24 32l-4-16M24 32h12l-6-16h4" />
    </>
  ),
  flame,
  snow: <path d="M24 6v36M8 15l32 18M8 33l32-18" />,
  couch: (
    <>
      <path d="M8 22c0-4 3-6 6-6h20c3 0 6 2 6 6v10H8z" />
      <path d="M4 24v12h4M44 24v12h-4M8 32h32" />
    </>
  ),
  party: (
    <>
      <path d="M8 40L16 16l16 16z" />
      <path d="M28 8v4M38 14l-3 3M41 25h-4M30 18l3-3" />
    </>
  ),
  laptop: (
    <>
      <rect x="10" y="12" width="28" height="20" rx="2" />
      <path d="M4 38h40" />
    </>
  ),
  chat: <path d="M8 10h32v22H22l-8 8v-8H8z" />,
  run: (
    <>
      <circle cx="28" cy="8" r="4" />
      <path d="M26 14l-6 12 8 4-2 12M20 26l-10 2M28 30l8-4" />
    </>
  ),

  // ---- venue extras
  coffee: (
    <>
      <path d="M10 18h24v10c0 6-5 10-12 10s-12-4-12-10z" />
      <path d="M34 20h4c3 0 4 2 4 4s-2 4-4 4h-4M8 42h28" />
      <path d="M18 8c-3 3 3 5 0 8M26 8c-3 3 3 5 0 8" />
    </>
  ),
  cake,

  // ---- cuisines
  pizza: (
    <>
      <path d="M8 12c10-5 22-5 32 0L24 42z" />
      <circle cx="20" cy="19" r="2.5" />
      <circle cx="29" cy="21" r="2.5" />
      <circle cx="24" cy="31" r="2" />
    </>
  ),
  burgers: (
    <>
      <path d="M8 22c0-9 7-14 16-14s16 5 16 14z" />
      <path d="M8 28c4 3 7-3 11 0s7-3 11 0 7-3 10 0" />
      <path d="M9 34h30c0 5-3 7-7 7H16c-4 0-7-2-7-7z" />
      <path d="M18 14h.1M24 12h.1M30 14h.1" strokeWidth={3.2} />
    </>
  ),
  tacos: (
    <>
      <path d="M6 36c0-14 10-22 18-22s18 8 18 22z" />
      <path d="M12 30c3-4 6 0 9-3s6 1 9-2" />
    </>
  ),
  ramen: ramenBowl,
  pho: (
    <>
      {bowl}
      {bowlBase}
      {steam}
      <path d="M26 22c0-6 6-8 9-8 0 4-3 8-9 8z" />
    </>
  ),
  sushi: (
    <>
      <rect x="8" y="28" width="32" height="12" rx="6" />
      <path d="M8 30c4-12 28-12 32 0" />
      <path d="M20 21l-2 8M28 20l-2 9" />
    </>
  ),
  poke: (
    <>
      {bowl}
      {bowlBase}
      <circle cx="17" cy="18" r="3" />
      <circle cx="25" cy="15" r="3" />
      <circle cx="33" cy="18" r="3" />
    </>
  ),
  salad: (
    <>
      {bowl}
      {bowlBase}
      <path d="M13 22c0-6 5-8 8-4M23 20c1-7 8-8 11-2M30 23c3-5 8-3 8 1" />
    </>
  ),
  mediterranean: (
    <>
      <path d="M6 38a18 18 0 0 1 36 0z" />
      <circle cx="17" cy="22" r="4" />
      <circle cx="25" cy="17" r="4" />
      <circle cx="33" cy="22" r="4" />
    </>
  ),
  italian: (
    <>
      <circle cx="24" cy="26" r="15" />
      <path d="M24 26c-2 0-3-2-2-3.5 2-3 7-1 6 3.5-1 5-9 5-10-1-1-7 8-11 14-6" />
    </>
  ),
  thai: (
    <>
      {bowl}
      {bowlBase}
      <path d="M28 20a6 6 0 0 1 11 0z" />
      <path d="M14 18c4-6 10-8 14-6" />
    </>
  ),
  indian: (
    <>
      <path d="M24 6c8 8 12 16 12 22a12 12 0 0 1-24 0c0-6 4-14 12-22z" />
      <path d="M20 28h.1M28 24h.1M24 34h.1M27 30h.1" strokeWidth={3.2} />
    </>
  ),
  chinese: (
    <>
      <path d="M10 18h28l-4 24H14z" />
      <path d="M10 18l6-8h16l6 8M30 4l-8 14M36 6l-8 12" />
    </>
  ),
  korean: (
    <>
      <path d="M10 22h28v8a10 10 0 0 1-10 10h-8A10 10 0 0 1 10 30z" />
      <path d="M6 24h4M38 24h4" />
      {steam}
    </>
  ),
  bbq: (
    <>
      <path d="M8 32h32M12 32v10M36 32v10" />
      <path d="M24 8c4 6 8 8 6 14-1 3-4 4-6 4s-5-1-6-4c-2-6 4-8 6-14z" />
    </>
  ),
  sandwiches: (
    <>
      <path d="M6 20c4-8 32-8 36 0z" />
      <path d="M6 26c3 3 6-3 9 0s6-3 9 0 6-3 9 0 6-3 9 0" />
      <path d="M8 32h32v4c0 3-2 5-5 5H13c-3 0-5-2-5-5z" />
    </>
  ),
  breakfast: (
    <>
      <path d="M10 24c-2-8 6-14 14-12 8-2 16 4 14 12 2 8-6 14-14 12-8 2-16-4-14-12z" />
      <circle cx="24" cy="24" r="6" />
    </>
  ),
  steakhouse: (
    <>
      <path d="M8 22c0-8 10-14 20-12 10 2 14 10 10 18s-14 10-22 8S8 30 8 22z" />
      <circle cx="18" cy="24" r="4" />
    </>
  ),
  seafood: (
    <>
      <path d="M6 24c8-10 20-10 28 0-8 10-20 10-28 0z" />
      <path d="M34 24l8-7v14z" />
      <path d="M16 22h.1" strokeWidth={3.4} />
    </>
  ),
  wings: (
    <>
      <path d="M30 8c8 0 12 8 8 14-4 6-10 4-14 8l-4-4c4-4 2-10 8-14z" />
      <path d="M20 30l-8 8M10 34l-4 2M14 40l-2 4" />
    </>
  ),
  dessert: cupcake,

  // ---- bar styles
  cocktail: (
    <>
      <path d="M8 10h32L24 28z" />
      <path d="M24 28v12M16 40h16" />
      <circle cx="34" cy="8" r="3" />
    </>
  ),
  beer: (
    <>
      <path d="M10 16h22v24H10z" />
      <path d="M32 20h6c2 0 4 2 4 5v5c0 3-2 5-4 5h-6" />
      <path d="M10 16c0-6 6-8 10-6 3-3 10-1 12 6" />
    </>
  ),
  wine: wineGlass,
  dive: (
    <>
      <circle cx="24" cy="24" r="16" />
      <circle cx="24" cy="22" r="6" />
      <path d="M22 20c0-2 4-2 4 0s-4 3-4 5 4 2 4 0" strokeWidth={1.8} />
    </>
  ),
  rooftop: (
    <>
      <path d="M6 42V24h8v18M14 42V14h10v28M24 42V28h8v14M32 42h10" />
      <circle cx="38" cy="10" r="4" />
    </>
  ),
  sports: (
    <>
      <path d="M8 34C8 18 18 8 34 8c6 0 6 0 6 6 0 16-10 26-26 26-6 0-6 0-6-6z" />
      <path d="M17 31l14-14M22 26l3 3M26 22l3 3" />
    </>
  ),

  // ---- coffee styles
  espresso: (
    <>
      <path d="M10 22h24v8c0 5-5 8-12 8s-12-3-12-8z" />
      <path d="M34 24h4c3 0 4 2 4 3s-2 3-4 3h-4M8 42h28" />
      <path d="M18 8c-3 3 3 5 0 9M26 8c-3 3 3 5 0 9" />
    </>
  ),
  latte: (
    <>
      <path d="M14 8h20l-2 32H16z" />
      <path d="M15 18h18M16 28h16" />
    </>
  ),
  matcha: (
    <>
      {bowl}
      {bowlBase}
      <path d="M18 14c4-4 12-4 14 0-4 4-10 4-14 0z" />
    </>
  ),
  boba: (
    <>
      <path d="M12 14h24l-3 28H15z" />
      <path d="M10 14h28M26 14l4-10" />
      <circle cx="20" cy="35" r="2" />
      <circle cx="27" cy="36" r="2" />
      <circle cx="30" cy="31" r="2" />
    </>
  ),
  cafe: <path d="M6 32c4-10 10-16 18-16s14 6 18 16c-4 2-8 0-10-4-2 4-6 4-8 4s-6 0-8-4c-2 4-6 6-10 4z" />,

  // ---- dessert styles
  icecream: (
    <>
      <path d="M14 24h20L24 44z" />
      <path d="M12 24c-2-8 4-14 12-14s14 6 12 14z" />
    </>
  ),
  bakery: (
    <>
      <path d="M8 32c-4-8 2-16 10-16h12c8 0 14 8 10 16v6H8z" />
      <path d="M16 22l2 6M24 22l2 6M32 22l2 6" />
    </>
  ),
  chocolate: (
    <>
      <rect x="10" y="8" width="28" height="32" rx="3" />
      <path d="M10 19h28M10 29h28M19 8v32M29 8v32" />
    </>
  ),
  cookies: (
    <>
      <circle cx="24" cy="24" r="16" />
      <path d="M18 18h.1M30 20h.1M20 30h.1M31 31h.1M25 25h.1" strokeWidth={4} />
    </>
  ),
  crepes: (
    <>
      <path d="M6 36C6 20 16 10 40 10c0 18-10 28-34 26z" />
      <path d="M14 28c4-2 9-7 13-12" />
    </>
  ),
};

export function Doodle({ name, size, className = "" }: { name: string; size?: number; className?: string }) {
  const icon = ICONS[name];
  if (!icon) return null;
  return (
    <svg
      className={`doodle ${className}`}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <circle className="blob" cx="25" cy="27" r="19" />
      <g className="ink" filter="url(#doodle-wobble)">
        {icon}
      </g>
    </svg>
  );
}

/** Rendered once in the layout: the shared wobble filter that makes strokes look hand-drawn. */
export function DoodleDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="doodle-wobble" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
        </filter>
      </defs>
    </svg>
  );
}
