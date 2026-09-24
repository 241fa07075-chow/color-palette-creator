import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Go to picker
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back
          home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { to: "/", label: "Picker", exact: true },
  { to: "/palettes", label: "Palettes", exact: false },
  { to: "/gradients", label: "Gradients", exact: false },
] as const;

function SiteNav() {
  return (
    <header className="border-b border-border/70">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <div className="grid h-16 grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-center gap-3 sm:flex sm:justify-between">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grad-chip size-7 shrink-0 rounded-[min(1vw,10px)] ring-1 ring-white/10" />
            <span className="truncate font-display text-base font-semibold tracking-tight sm:text-lg">
              Chroma<span className="text-primary">Lab</span>
            </span>
          </Link>
          <nav className="flex min-w-0 items-center justify-end gap-1 overflow-x-auto rounded-full bg-card p-1 ring-1 ring-border/60">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                className="shrink-0"
              >
                {({ isActive }) => (
                  <span
                    className={cn(
                      "block rounded-full px-2.5 py-1.5 text-[13px] whitespace-nowrap transition-colors sm:px-4 sm:text-sm",
                      isActive
                        ? "bg-primary font-semibold text-primary-foreground"
                        : "font-medium text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 sm:px-8">
        <span className="font-display text-sm text-muted-foreground">
          ChromaLab — a color studio
        </span>
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          picker · palette · gradient
        </span>
      </div>
    </footer>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ChromaLab — Color picker, palettes & gradients" },
      {
        name: "description",
        content:
          "A playful color studio: pick colors in HEX, RGB and HSL, build harmonious palettes, and create CSS gradients.",
      },
      { name: "author", content: "ChromaLab" },
      { property: "og:title", content: "ChromaLab — Color studio" },
      {
        property: "og:description",
        content:
          "Pick colors in HEX, RGB and HSL, build harmonious palettes, and create CSS gradients.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-background font-body text-foreground antialiased">
        <SiteNav />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}
