import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, Plus, X } from "lucide-react";

import { copyText, readableText } from "@/lib/color";

export const Route = createFileRoute("/gradients")({
  component: GradientsPage,
  head: () => ({
    meta: [
      { title: "ChromaLab — Gradient Creator" },
      {
        name: "description",
        content:
          "Blend two or more color stops into a smooth CSS gradient — set the angle, tweak each stop, and copy ready-to-paste CSS.",
      },
      { property: "og:title", content: "ChromaLab — Gradient Creator" },
      {
        property: "og:description",
        content:
          "Blend color stops into a smooth CSS gradient — set the angle and copy ready-to-paste CSS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

interface Stop {
  id: number;
  color: string;
  pos: number;
}

const INITIAL_STOPS: Stop[] = [
  { id: 1, color: "#FF5C39", pos: 0 },
  { id: 2, color: "#FFD23F", pos: 48 },
  { id: 3, color: "#35D0A0", pos: 100 },
];

let nextId = 4;

function GradientsPage() {
  const [stops, setStops] = useState<Stop[]>(INITIAL_STOPS);
  const [angle, setAngle] = useState(135);

  const sorted = [...stops].sort((a, b) => a.pos - b.pos);
  const gradientCss = `linear-gradient(${angle}deg, ${sorted
    .map((s) => `${s.color} ${s.pos}%`)
    .join(", ")})`;

  const updateStop = (id: number, patch: Partial<Stop>) =>
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const addStop = () =>
    setStops((prev) => {
      if (prev.length >= 5) return prev;
      const sortedPos = prev.map((s) => s.pos).sort((a, b) => a - b);
      let bestStart = sortedPos[0] ?? 0;
      let bestGap = 0;
      for (let i = 0; i < sortedPos.length - 1; i++) {
        const gap = (sortedPos[i + 1] ?? 0) - (sortedPos[i] ?? 0);
        if (gap > bestGap) {
          bestGap = gap;
          bestStart = sortedPos[i] ?? 0;
        }
      }
      const pos =
        bestGap > 1
          ? Math.round(bestStart + bestGap / 2)
          : (sortedPos.at(-1) ?? 100) >= 100
            ? 100
            : 0;
      return [...prev, { id: nextId++, color: "#4CC9F0", pos }];
    });

  const removeStop = (id: number) =>
    setStops((prev) => (prev.length > 2 ? prev.filter((s) => s.id !== id) : prev));

  const copyCss = async () => {
    const ok = await copyText(`background: ${gradientCss};`);
    toast(ok ? "Copied CSS gradient" : "Couldn't access the clipboard");
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: preview */}
        <div className="lg:col-span-7">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Gradient creator
          </p>
          <h1 className="mb-6 max-w-[40ch] font-display text-3xl font-semibold leading-none text-balance sm:text-4xl">
            Blend two stops into a story.
          </h1>
          <div
            className="relative h-64 overflow-hidden rounded-3xl ring-1 ring-white/10 sm:h-80"
            style={{ background: gradientCss }}
          >
            <div className="absolute bottom-4 left-4 flex gap-2">
              {sorted.map((s) => (
                <span
                  key={s.id}
                  title={`${s.color} at ${s.pos}%`}
                  className="size-8 rounded-full ring-2 ring-foreground/80"
                  style={{ backgroundColor: s.color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: controls */}
        <div className="space-y-5 rounded-3xl bg-card p-5 ring-1 ring-border/60 sm:p-6 lg:col-span-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Angle
            </p>
            <span className="font-display text-lg font-semibold text-accent">
              {angle}°
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            value={angle}
            aria-label="Gradient angle"
            onChange={(e) => setAngle(Number(e.target.value))}
            className="color-slider"
            style={{
              background:
                "linear-gradient(90deg, #FF5C39, #FFD23F, #35D0A0, #4CC9F0, #FF5C39)",
            }}
          />

          <div className="space-y-3 pt-1">
            {sorted.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <input
                  type="color"
                  value={s.color}
                  aria-label={`Stop color ${s.color}`}
                  onChange={(e) => updateStop(s.id, { color: e.target.value.toUpperCase() })}
                  className="size-6 shrink-0 cursor-pointer rounded-lg ring-1 ring-white/15"
                />
                <span className="w-20 shrink-0 font-display text-sm font-medium">
                  {s.color}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={s.pos}
                  aria-label={`Stop position for ${s.color}`}
                  onChange={(e) => updateStop(s.id, { pos: Number(e.target.value) })}
                  className="color-slider min-w-0 flex-1"
                  style={{ background: "transparent" }}
                />
                <span className="w-10 shrink-0 text-right text-sm text-muted-foreground">
                  {s.pos}%
                </span>
                <button
                  onClick={() => removeStop(s.id)}
                  disabled={stops.length <= 2}
                  aria-label={`Remove stop ${s.color}`}
                  className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addStop}
            disabled={stops.length >= 5}
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground ring-1 ring-border/60 transition hover:bg-border/40 disabled:opacity-40"
          >
            <Plus className="size-4" />
            Add stop
          </button>

          <div className="border-t border-border/60 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              CSS output
            </p>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-background p-3 ring-1 ring-border/60">
              <code className="truncate text-xs text-muted-foreground">
                background: {gradientCss};
              </code>
              <button
                onClick={copyCss}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary py-2 pr-3 pl-3 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
              >
                <Copy className="size-3.5" />
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
