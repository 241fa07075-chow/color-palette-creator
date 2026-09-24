import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Lock, LockOpen, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  copyText,
  generatePalette,
  readableText,
  type Harmony,
} from "@/lib/color";

export const Route = createFileRoute("/palettes")({
  component: PalettesPage,
  head: () => ({
    meta: [
      { title: "ChromaLab — Palette Builder" },
      {
        name: "description",
        content:
          "Generate harmonious 5-color palettes — analogous, complementary, triadic or random. Lock the colors you love and regenerate the rest.",
      },
      { property: "og:title", content: "ChromaLab — Palette Builder" },
      {
        property: "og:description",
        content:
          "Generate harmonious 5-color palettes, lock the colors you love and regenerate the rest.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const HARMONIES: { id: Harmony; label: string }[] = [
  { id: "analogous", label: "Analogous" },
  { id: "complementary", label: "Complementary" },
  { id: "triadic", label: "Triadic" },
  { id: "random", label: "Random" },
];

const INITIAL = ["#FF5C39", "#FFD23F", "#35D0A0", "#4CC9F0", "#7C5CFF"];

function PalettesPage() {
  const [colors, setColors] = useState<string[]>(INITIAL);
  const [locked, setLocked] = useState<boolean[]>([true, false, false, false, false]);
  const [mode, setMode] = useState<Harmony>("analogous");

  const regenerate = (nextMode: Harmony = mode) => {
    const anchor = colors.find((_, i) => locked[i]) ?? colors[0] ?? INITIAL[0]!;
    const generated = generatePalette(anchor, nextMode);
    setColors((prev) => prev.map((c, i) => (locked[i] ? c : generated[i] ?? c)));
  };

  const toggleLock = (i: number) =>
    setLocked((prev) => prev.map((v, j) => (j === i ? !v : v)));

  const copy = async (value: string) => {
    const ok = await copyText(value);
    toast(ok ? `Copied ${value}` : "Couldn't access the clipboard");
  };

  const copyAll = async () => {
    const css = colors
      .map((c, i) => `  --color-${i + 1}: ${c};`)
      .join("\n");
    const ok = await copyText(`:root {\n${css}\n}`);
    toast(ok ? "Copied all 5 colors as CSS variables" : "Couldn't access the clipboard");
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Palette builder
          </p>
          <h1 className="mt-1 max-w-[40ch] font-display text-3xl font-semibold leading-none text-balance sm:text-4xl">
            Harmonious sets, one tap away.
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {HARMONIES.map((hm) => (
              <button
                key={hm.id}
                onClick={() => {
                  setMode(hm.id);
                  regenerate(hm.id);
                }}
                className={cn(
                  "rounded-full px-4 py-2 text-sm ring-1 transition-colors",
                  mode === hm.id
                    ? "bg-secondary font-semibold text-foreground ring-border"
                    : "bg-card font-medium text-muted-foreground ring-border/60 hover:text-foreground",
                )}
              >
                {hm.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => regenerate()}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:brightness-105"
          >
            <RefreshCw className="size-4" />
            Regenerate
          </button>
          <button
            onClick={copyAll}
            className="rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground ring-1 ring-border/60 transition hover:bg-secondary"
          >
            Copy all
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {colors.map((color, i) => (
          <div
            key={i}
            className="flex h-40 flex-col justify-between rounded-2xl p-3 ring-1 ring-white/10 sm:h-48"
            style={{ backgroundColor: color }}
          >
            <button
              onClick={() => toggleLock(i)}
              aria-label={locked[i] ? `Unlock ${color}` : `Lock ${color}`}
              className={cn(
                "grid size-8 w-fit place-items-center rounded-full backdrop-blur transition",
                locked[i]
                  ? "bg-foreground/20 text-foreground"
                  : "bg-black/20 text-foreground/70 hover:bg-black/30",
              )}
              style={{ color: readableText(color) }}
            >
              {locked[i] ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
            </button>
            <button
              onClick={() => copy(color)}
              className="w-fit text-left"
              title={`Copy ${color}`}
            >
              <span
                className="font-display text-lg font-semibold"
                style={{ color: readableText(color) }}
              >
                {color}
              </span>
              <span
                className="mt-0.5 block text-[11px] font-medium"
                style={{ color: readableText(color), opacity: 0.7 }}
              >
                {locked[i] ? "locked" : "tap to copy"}
              </span>
            </button>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Tap the lock to keep a color, then regenerate — unlocked swatches reshuffle
        around your anchor color.
      </p>
    </div>
  );
}
