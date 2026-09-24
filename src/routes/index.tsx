import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatHsl,
  formatRgb,
  hslToHex,
  hexToHsl,
  hexToRgb,
  readableText,
  rgbToHsl,
  tintsAndShades,
  copyText,
  type HSL,
} from "@/lib/color";

export const Route = createFileRoute("/")({
  component: PickerPage,
  head: () => ({
    meta: [
      { title: "ChromaLab — Color Picker" },
      {
        name: "description",
        content:
          "Pick any color with precision sliders in HEX, RGB or HSL, copy it in one tap, and grab ready-made tints and shades.",
      },
      { property: "og:title", content: "ChromaLab — Color Picker" },
      {
        property: "og:description",
        content:
          "Pick any color with precision sliders in HEX, RGB or HSL, copy it in one tap, and grab ready-made tints and shades.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Format = "hex" | "rgb" | "hsl";
const FORMATS: { id: Format; label: string }[] = [
  { id: "hex", label: "HEX" },
  { id: "rgb", label: "RGB" },
  { id: "hsl", label: "HSL" },
];

function parseInput(text: string, format: Format): HSL | null {
  const t = text.trim();
  if (format === "hex") return hexToHsl(t);
  const parts = t
    .replace(/[,/%]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(Number);
  if (parts.length !== 3) return null;
  const [a, b, c] = parts;
  if (a === undefined || b === undefined || c === undefined) return null;
  if (format === "rgb") {
    if ([a, b, c].some((n) => n < 0 || n > 255)) return null;
    return rgbToHsl({ r: Math.round(a), g: Math.round(b), b: Math.round(c) });
  }
  if (a < 0 || a > 360 || b < 0 || b > 100 || c < 0 || c > 100) return null;
  return { h: a, s: b, l: c };
}

function displayValue(hex: string, format: Format): string {
  const rgb = hexToRgb(hex);
  const hsl = rgb ? rgbToHsl(rgb) : { h: 0, s: 0, l: 0 };
  if (format === "hex") return hex;
  if (format === "rgb") return formatRgb(rgb ?? { r: 0, g: 0, b: 0 });
  return `${hsl.h}, ${hsl.s}%, ${hsl.l}%`;
}

function ChannelSlider({
  label,
  value,
  max,
  track,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  track: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-medium text-muted-foreground">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="color-slider"
        style={{ background: track }}
      />
    </div>
  );
}

function PickerPage() {
  const [hsl, setHsl] = useState<HSL>({ h: 9, s: 100, l: 62 });
  const [format, setFormat] = useState<Format>("hex");
  const [text, setText] = useState("#FF5C39");
  const editing = useRef(false);

  const rgb = hexToRgb(hslToHex(hsl))!;
  const hex = hslToHex(hsl);

  useEffect(() => {
    if (!editing.current) setText(displayValue(hex, format));
  }, [hex, format]);

  const currentText =
    format === "hex"
      ? hex
      : format === "rgb"
        ? `rgb(${formatRgb(rgb)})`
        : `hsl(${formatHsl(hsl)})`;

  const invalid = text.trim() !== "" && parseInput(text, format) === null;

  const onTextChange = (v: string) => {
    setText(v);
    const parsed = parseInput(v, format);
    if (parsed) setHsl(parsed);
  };

  const copy = async (value: string, label = "color") => {
    const ok = await copyText(value);
    toast(ok ? `Copied ${label}: ${value}` : "Couldn't access the clipboard", {
      description: ok ? undefined : "Copy the value manually instead.",
    });
  };

  const spectrum =
    "linear-gradient(90deg, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))";
  const { h, s, l } = hsl;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: heading, swatch, format switch */}
        <div className="space-y-6 lg:col-span-7">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Color picker
              </p>
              <h1 className="mt-1 max-w-[20ch] font-display text-4xl font-semibold leading-none text-balance sm:text-5xl">
                Pick a hue, own the shade.
              </h1>
            </div>
            <span className="hidden shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
              <span className="size-2 rounded-full bg-mint" />
              Live
            </span>
          </div>

          {/* Big swatch */}
          <div
            className="relative h-56 overflow-hidden rounded-3xl ring-1 ring-white/10 sm:h-72"
            style={{ backgroundColor: hex }}
          >
            <div className="absolute inset-0 grid place-items-center px-4">
              <span
                className="truncate font-display text-2xl font-semibold tracking-tight sm:text-3xl"
                style={{ color: readableText(hex) }}
              >
                {hex}
              </span>
            </div>
            <button
              onClick={() => copy(currentText)}
              className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-background/80 py-2 pr-4 pl-3 text-sm font-semibold text-foreground ring-1 ring-white/15 backdrop-blur transition hover:bg-background"
            >
              <Copy className="size-4" />
              Copy
            </button>
          </div>

          {/* Format switch + value input */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex self-start rounded-full bg-card p-1 ring-1 ring-border/60">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm transition-colors",
                    format === f.id
                      ? "bg-accent font-semibold text-accent-foreground"
                      : "font-medium text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                onFocus={() => (editing.current = true)}
                onBlur={() => {
                  editing.current = false;
                  setText(displayValue(hex, format));
                }}
                aria-label="Color value"
                spellCheck={false}
                className={cn(
                  "h-10 w-full min-w-0 rounded-xl bg-card px-4 font-display text-sm font-medium ring-1 outline-none sm:w-52",
                  invalid
                    ? "text-destructive ring-destructive/60"
                    : "ring-border/60 focus:ring-2 focus:ring-ring",
                )}
              />
              <button
                onClick={() => copy(currentText)}
                aria-label="Copy value"
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-foreground ring-1 ring-border/60 transition hover:bg-secondary"
              >
                <Copy className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: channels + tints & shades */}
        <div className="space-y-5 rounded-3xl bg-card p-5 ring-1 ring-border/60 sm:p-6 lg:col-span-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Channels
          </p>

          {format === "hsl" ? (
            <>
              <ChannelSlider
                label="Hue"
                value={h}
                max={360}
                track={spectrum}
                onChange={(v) => setHsl({ ...hsl, h: v })}
              />
              <ChannelSlider
                label="Saturation"
                value={s}
                max={100}
                track={`linear-gradient(90deg, hsl(${h},0%,${l}%), hsl(${h},100%,${l}%))`}
                onChange={(v) => setHsl({ ...hsl, s: v })}
              />
              <ChannelSlider
                label="Lightness"
                value={l}
                max={100}
                track={`linear-gradient(90deg, #000, hsl(${h},100%,50%), #fff)`}
                onChange={(v) => setHsl({ ...hsl, l: v })}
              />
            </>
          ) : (
            <>
              <ChannelSlider
                label="Red"
                value={rgb.r}
                max={255}
                track={`linear-gradient(90deg, rgb(0,${rgb.g},${rgb.b}), rgb(255,${rgb.g},${rgb.b}))`}
                onChange={(v) => setHsl(rgbToHsl({ ...rgb, r: v }))}
              />
              <ChannelSlider
                label="Green"
                value={rgb.g}
                max={255}
                track={`linear-gradient(90deg, rgb(${rgb.r},0,${rgb.b}), rgb(${rgb.r},255,${rgb.b}))`}
                onChange={(v) => setHsl(rgbToHsl({ ...rgb, g: v }))}
              />
              <ChannelSlider
                label="Blue"
                value={rgb.b}
                max={255}
                track={`linear-gradient(90deg, rgb(${rgb.r},${rgb.g},0), rgb(${rgb.r},${rgb.g},255))`}
                onChange={(v) => setHsl(rgbToHsl({ ...rgb, b: v }))}
              />
            </>
          )}

          <div className="border-t border-border/60 pt-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Tints &amp; shades
            </p>
            <div className="flex gap-2">
              {tintsAndShades(hex).map((c) => (
                <button
                  key={c}
                  title={`Copy ${c}`}
                  aria-label={`Copy ${c}`}
                  onClick={() => copy(c)}
                  className="h-12 flex-1 rounded-xl ring-1 ring-white/10 transition hover:scale-[1.04]"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
