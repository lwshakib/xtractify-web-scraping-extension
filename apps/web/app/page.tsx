"use client"

import {
  CheckCircle2,
  Download,
  Monitor,
  MoonStar,
  MousePointerClick,
  PackageOpen,
  Sun,
} from "lucide-react"
import Logo from "@/components/logo"

const steps = [
  "Download the latest extension ZIP file.",
  "Unzip it to a permanent folder on your computer.",
  "Open Chrome and go to chrome://extensions.",
  "Enable Developer mode.",
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90 selection:bg-sage/20 selection:text-sage dark:from-background dark:to-background/80">
      <div className="grainy-bg opacity-60 dark:opacity-40" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sage/35 bg-sage/15 dark:border-sage/40 dark:bg-sage/25">
            <Logo size={28} className="h-7 w-7" />
          </div>
          <div>
            <p className="font-display text-xl font-semibold tracking-tight text-foreground">
              Xtractify
            </p>
            <p className="text-xs text-foreground/50">
              Smart web scraping extension
            </p>
          </div>
        </div>
        <a
          href="#download"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background shadow-sm transition hover:opacity-90"
        >
          Download ZIP
        </a>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 md:px-10">
        <section className="glass-card mb-10 rounded-3xl border border-foreground/10 bg-white/80 p-8 shadow-sm backdrop-blur-sm md:p-12 dark:border-white/10 dark:bg-card/80">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sage/30 bg-sage/10 px-4 py-2 text-xs font-semibold tracking-wider text-sage uppercase dark:border-sage/40 dark:bg-sage/20">
            <Monitor className="h-4 w-4" />
            Matches your device theme automatically
          </div>
          <h1 className="mb-5 max-w-3xl font-display text-4xl leading-tight font-semibold tracking-tight text-foreground md:text-6xl">
            Xtractify extension + landing page are now aligned to one visual
            theme.
          </h1>
          <p className="mb-8 max-w-2xl text-base text-foreground/60 md:text-lg">
            The extension UI follows your device light/dark setting
            automatically, and uses the same color language as this website for
            a consistent experience.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              id="download"
              href="/xtractify-extension.zip"
              download
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-sm transition hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Download Extension ZIP
            </a>
            <a
              href="#install"
              className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-6 py-3 text-sm font-semibold text-foreground/80 transition hover:border-sage hover:text-sage dark:border-white/20"
            >
              <PackageOpen className="h-4 w-4" />
              Installation Guide
            </a>
          </div>
        </section>

        <section className="mb-10 grid gap-6 md:grid-cols-3">
          <div className="glass-card rounded-2xl border border-foreground/10 bg-white/75 p-6 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-card/75">
            <Sun className="mb-4 h-6 w-6 text-sage" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Light mode
            </h3>
            <p className="text-sm text-foreground/60">
              If your system is in light mode, Xtractify shows light UI
              automatically.
            </p>
          </div>
          <div className="glass-card rounded-2xl border border-foreground/10 bg-white/75 p-6 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-card/75">
            <MoonStar className="mb-4 h-6 w-6 text-sage" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Dark mode
            </h3>
            <p className="text-sm text-foreground/60">
              If your system is in dark mode, Xtractify switches to dark UI.
            </p>
          </div>
          <div className="glass-card rounded-2xl border border-foreground/10 bg-white/75 p-6 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-card/75">
            <Monitor className="mb-4 h-6 w-6 text-sage" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Same brand colors
            </h3>
            <p className="text-sm text-foreground/60">
              Extension and website share a unified Xtractify design language.
            </p>
          </div>
        </section>

        <section
          id="install"
          className="glass-card rounded-3xl border border-foreground/10 bg-white/80 p-8 shadow-sm backdrop-blur-sm md:p-10 dark:border-white/10 dark:bg-card/80"
        >
          <h2 className="mb-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Install from ZIP (2 methods)
          </h2>
          <p className="mb-8 max-w-3xl text-foreground/60">
            After downloading and unzipping, use either of these methods in
            Chrome Extensions page.
          </p>

          <div className="mb-8 grid gap-3">
            {steps.map((step) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-background/70 px-4 py-3 dark:border-white/10 dark:bg-background/50"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-sage" />
                <span className="text-sm text-foreground/80 md:text-base">
                  {step}
                </span>
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-foreground/10 bg-background/60 p-6 dark:border-white/10 dark:bg-background/40">
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Method 1: Load unpacked
              </h3>
              <p className="mb-3 text-sm text-foreground/60">
                In <code>chrome://extensions</code>, click{" "}
                <strong>Load unpacked</strong> and select the unzipped extension
                folder.
              </p>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-sage">
                <MousePointerClick className="h-4 w-4" />
                Recommended for development/testing
              </div>
            </article>
            <article className="rounded-2xl border border-foreground/10 bg-background/60 p-6 dark:border-white/10 dark:bg-background/40">
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Method 2: Drag and drop
              </h3>
              <p className="mb-3 text-sm text-foreground/60">
                With Developer mode enabled, drag the unzipped extension folder
                and drop it into the extensions page.
              </p>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-sage">
                <MousePointerClick className="h-4 w-4" />
                Quick manual installation
              </div>
            </article>
          </div>
        </section>

        <footer className="mt-12 rounded-3xl border border-foreground/10 bg-white/80 p-8 shadow-sm backdrop-blur-sm md:p-10 dark:border-white/10 dark:bg-card/80">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-sage/30 bg-sage/15 text-sage dark:border-sage/40 dark:bg-sage/25">
                  <Logo size={24} />
                </div>
                <div>
                  <p className="font-display text-lg font-semibold text-foreground">
                    Xtractify
                  </p>
                  <p className="text-xs text-foreground/55">
                    Smart web scraping extension
                  </p>
                </div>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-foreground/65">
                Extract structured data from websites in a few clicks. Xtractify
                keeps the same visual style in the extension and web app, with
                automatic light and dark mode support.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 md:col-span-7 md:grid-cols-3">
              <div>
                <h4 className="mb-3 text-sm font-semibold tracking-wider text-foreground/80 uppercase">
                  Product
                </h4>
                <ul className="space-y-2 text-sm text-foreground/65">
                  <li>
                    <a href="#download" className="transition hover:text-sage">
                      Download ZIP
                    </a>
                  </li>
                  <li>
                    <a href="#install" className="transition hover:text-sage">
                      Install Guide
                    </a>
                  </li>
                  <li>
                    <a href="#install" className="transition hover:text-sage">
                      Browser Setup
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-semibold tracking-wider text-foreground/80 uppercase">
                  Resources
                </h4>
                <ul className="space-y-2 text-sm text-foreground/65">
                  <li>
                    <a href="#install" className="transition hover:text-sage">
                      Load unpacked method
                    </a>
                  </li>
                  <li>
                    <a href="#install" className="transition hover:text-sage">
                      Drag and drop method
                    </a>
                  </li>
                  <li>
                    <a href="#install" className="transition hover:text-sage">
                      Troubleshooting
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-semibold tracking-wider text-foreground/80 uppercase">
                  Contact
                </h4>
                <ul className="space-y-2 text-sm text-foreground/65">
                  <li>support@xtractify.dev</li>
                  <li>Mon-Fri, 9AM-6PM</li>
                  <li>Remote-first team</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-foreground/10 pt-6 text-xs text-foreground/50 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
            <p>© 2026 Xtractify. All rights reserved.</p>
            <p>Built for fast data extraction workflows.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
