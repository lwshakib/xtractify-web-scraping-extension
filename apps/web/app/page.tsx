"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Database,
  Cpu,
  Download,
  Target,
  Cloud,
  Table,
  ArrowRight,
  Plus,
  MousePointer2,
  Table2,
  FileJson,
  Zap,
  CheckCircle2,
  Globe,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

const Navbar = () => (
  <motion.nav
    initial={{ y: -20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6"
  >
    <div className="flex items-center gap-2">
      <div className="bg-sage font-display flex h-8 w-8 items-center justify-center rounded-lg font-bold text-primary-foreground">
        X
      </div>
      <span className="font-display text-xl font-semibold tracking-tight text-foreground">
        Xtractify
      </span>
    </div>
    <div className="hidden items-center gap-8 text-sm font-medium text-foreground/60 md:flex">
      <a href="#features" className="transition-colors hover:text-foreground">
        Features
      </a>
      <a href="#pricing" className="transition-colors hover:text-foreground">
        Pricing
      </a>
      <a href="#docs" className="transition-colors hover:text-foreground">
        Documentation
      </a>
    </div>
    <button className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-lg shadow-foreground/10 transition-all hover:bg-foreground/80">
      Add to Chrome
    </button>
  </motion.nav>
)

const BentoItem = ({
  title,
  description,
  icon: Icon,
  className = "",
  delay = 0,
  children,
}: {
  title: string
  description: string
  icon: any
  className?: string
  delay?: number
  children?: React.ReactNode
}) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={`glass-card group flex flex-col justify-between rounded-[2rem] p-8 transition-all duration-500 hover:border-sage/40 hover:shadow-xl hover:shadow-sage/5 ${className}`}
  >
    <div>
      <div className="bg-warm-grey-dark mb-6 flex h-12 w-12 items-center justify-center rounded-2xl text-sage transition-all duration-500 group-hover:bg-sage group-hover:text-primary-foreground">
        <Icon size={24} />
      </div>
      <h3 className="font-display mb-2 text-xl font-semibold text-foreground">{title}</h3>
      <p className="text-foreground/50 text-sm leading-relaxed max-w-[280px]">
        {description}
      </p>
    </div>
    {children && <div className="mt-8">{children}</div>}
  </motion.div>
)

const FloatingIcon = () => (
  <div className="relative mb-12 mx-auto h-64 w-64">
    {/* Background Glow */}
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.2, 0.3, 0.2],
      }}
      transition={{ duration: 4, repeat: Infinity }}
      className="bg-sage absolute inset-0 rounded-full blur-[80px]"
    />

    {/* Main Icon Vessel */}
    <motion.div
      animate={{
        y: [-10, 10, -10],
        rotateX: [0, 5, 0],
        rotateY: [0, 5, 0],
      }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="glass-card relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-[3rem] border-white/60 shadow-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-sage/10" />

      {/* Abstract Data Blocks */}
      <div className="relative flex h-40 w-32 flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.2 + 0.5 }}
            className={`h-6 rounded-lg border border-white/20 ${i === 1 ? "bg-sage/40" : "bg-black/5"}`}
            style={{ width: `${80 + i * 5}%` }}
          />
        ))}

        {/* The "Lens" */}
        <motion.div
          animate={{ x: [-20, 20, -20], y: [-20, 20, -20] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="glass-card border-sage/30 absolute -top-4 -right-4 flex h-24 w-24 items-center justify-center p-4 shadow-xl rounded-full"
        >
          <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-sage/20">
            <Plus size={24} className="text-sage" />
          </div>
        </motion.div>
      </div>
    </motion.div>

    {/* Shadow */}
    <motion.div
      animate={{
        scale: [0.8, 1, 0.8],
        opacity: [0.1, 0.2, 0.1],
      }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -bottom-8 left-1/2 h-8 w-48 -translate-x-1/2 rounded-full bg-foreground blur-2xl"
    />
  </div>
)

export default function LandingPage() {
  return (
    <div className="selection:bg-sage/20 selection:text-sage min-h-screen">
      <div className="grainy-bg" />
      <Navbar />

      <main className="mx-auto max-w-7xl px-8 pt-40">
        {/* Hero Section */}
        <section className="mb-40 text-center">
          <FloatingIcon />

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h1 className="font-display mb-8 mx-auto max-w-4xl text-6xl font-medium tracking-tight leading-[0.95] text-foreground md:text-8xl">
              Xtractify: Extract Web Data{" "}
              <span className="text-sage italic">Effortlessly</span>
            </h1>
            <p className="text-foreground/40 mx-auto mb-12 max-w-2xl text-lg font-medium md:text-xl">
              The premium Chrome extension for high-fidelity data scraping. Turn
              any website into a structured database in seconds.
            </p>

            <div className="flex flex-col items-center gap-6">
              <button className="shadow-foreground/20 group relative flex items-center gap-3 rounded-full bg-foreground px-10 py-5 text-lg font-semibold text-background shadow-2xl transition-all hover:bg-foreground/90 active:scale-95">
                <Globe
                  size={22}
                  className="transition-transform group-hover:rotate-12"
                />
                Add to Chrome
                <motion.div
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  className="bg-sage absolute bottom-0 left-0 h-1 rounded-full"
                />
              </button>
              <button className="text-foreground/40 group flex items-center gap-1 text-sm font-semibold transition-colors hover:text-foreground">
                Watch demo{" "}
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>
          </motion.div>
        </section>

        {/* Bento Grid */}
        <section id="features" className="relative mb-40">
          <div className="pointer-events-none absolute inset-0 z-0 opacity-20">
            <svg
              className="h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 20 0 L 20 100"
                stroke="#81A18B"
                strokeWidth="0.1"
                fill="none"
              />
              <path
                d="M 40 0 L 40 100"
                stroke="#81A18B"
                strokeWidth="0.1"
                fill="none"
              />
              <path
                d="M 60 0 L 60 100"
                stroke="#81A18B"
                strokeWidth="0.1"
                fill="none"
              />
              <path
                d="M 80 0 L 80 100"
                stroke="#81A18B"
                strokeWidth="0.1"
                fill="none"
              />
              <path
                d="M 0 20 L 100 20"
                stroke="#81A18B"
                strokeWidth="0.1"
                fill="none"
              />
              <path
                d="M 0 40 L 100 40"
                stroke="#81A18B"
                strokeWidth="0.1"
                fill="none"
              />
              <path
                d="M 0 60 L 100 60"
                stroke="#81A18B"
                strokeWidth="0.1"
                fill="none"
              />
              <path
                d="M 0 80 L 100 80"
                stroke="#81A18B"
                strokeWidth="0.1"
                fill="none"
              />
            </svg>
          </div>
          <div className="bento-grid relative z-10">
            <BentoItem
              title="Smart Data Extraction"
              description="Identify patterns automatically. Our engine learns the structure of any site, making repeated tasks a breeze."
              icon={Database}
              className="col-span-12 h-[400px] md:col-span-8"
              delay={0.1}
            >
              <div className="relative mt-4 flex h-full gap-4 overflow-hidden">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="glass-card min-w-[200px] flex-1 flex flex-col gap-3 rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="bg-warm-grey-dark h-8 w-8 rounded-lg" />
                      <div className="bg-sage/20 h-2 w-12 rounded-full" />
                    </div>
                    <div className="h-4 w-full rounded bg-black/5" />
                    <div className="h-4 w-2/3 rounded bg-black/5" />
                    <div className="from-sage/10 mt-auto h-20 rounded-lg bg-gradient-to-t to-transparent" />
                  </div>
                ))}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-warm-grey/20" />
              </div>
            </BentoItem>

            <BentoItem
              title="AI-Powered Parsing"
              description="Clean and normalize data instantly with built-in Gemini LLM processing."
              icon={Cpu}
              className="col-span-12 h-[400px] md:col-span-4"
              delay={0.2}
            >
              <div className="mt-12 space-y-4">
                {[
                  { text: "Unstructured HTML", active: false },
                  { text: "AI Semantic Analysis", active: true },
                  { text: "Normalized JSON", active: false },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${item.active ? "border-sage bg-sage/5" : "border-foreground/5"}`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${item.active ? "bg-sage animate-pulse" : "bg-foreground/10"}`}
                    />
                    <span
                      className={`font-mono text-xs font-medium ${item.active ? "text-sage" : "text-foreground/30"}`}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </BentoItem>

            <BentoItem
              title="Direct Export"
              description="Everything you need, in the formats you want. CSV, JSON, or direct to Google Sheets."
              icon={Download}
              className="col-span-12 h-[400px] md:col-span-4"
              delay={0.3}
            >
              <div className="relative mt-8 h-40 transition-transform duration-700 group-hover:scale-105">
                <div className="glass-card absolute top-0 left-0 flex h-24 w-24 items-center justify-center rounded-2xl text-sage">
                  <FileJson size={32} />
                </div>
                <div className="glass-card text-terracotta absolute top-1/2 left-12 flex h-24 w-24 translate-x-12 -translate-y-[20%] rotate-6 items-center justify-center rounded-2xl">
                  <Table2 size={32} />
                </div>
              </div>
            </BentoItem>

            <BentoItem
              title="Visual Selector"
              description="No code required. Click to select, right-click to refine. Sophisticated selection logic for complex layouts."
              icon={Target}
              className="col-span-12 h-[400px] md:col-span-8"
              delay={0.4}
            >
              <div className="relative flex h-full w-full items-center justify-center rounded-2xl border-2 border-dashed border-sage/20 bg-sage/5 transition-colors group-hover:border-sage/40">
                <motion.div
                  animate={{
                    x: [0, 40, -40, 0],
                    y: [0, -40, 40, 0],
                  }}
                  transition={{ duration: 10, repeat: Infinity }}
                  className="flex items-center gap-2 rounded-full bg-white p-4 shadow-2xl"
                >
                  <MousePointer2 size={16} className="text-sage" />
                  <span className="text-sage text-xs font-semibold">
                    Selecting data...
                  </span>
                </motion.div>
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-4 p-4 opacity-10">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="rounded-lg border border-foreground" />
                  ))}
                </div>
              </div>
            </BentoItem>

            <BentoItem
              title="Cloud Sync"
              description="Extract once, access everywhere. Your scraping recipes move with your account automatically."
              icon={Cloud}
              className="col-span-12 h-[350px] md:col-span-6"
              delay={0.5}
            >
              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-4 overflow-hidden">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-warm-grey-dark inline-block h-10 w-10 rounded-full ring-2 ring-background"
                    />
                  ))}
                </div>
                <span className="text-foreground/30 text-xs font-medium">
                  + 42,000 synchronized users
                </span>
              </div>
            </BentoItem>

            <BentoItem
              title="Structured Tables"
              description="Instant visual previews of your data. See exactly what you're getting before you export."
              icon={Table}
              className="col-span-12 h-[350px] md:col-span-6"
              delay={0.6}
            >
              <div className="mt-8 space-y-2">
                {[0, 1].map((i) => (
                  <div key={i} className="flex gap-2">
                    <div className="bg-sage/10 h-6 w-16 shrink-0 rounded" />
                    <div className="h-6 flex-1 rounded bg-foreground/5" />
                    <div className="h-6 w-10 rounded bg-foreground/5" />
                  </div>
                ))}
              </div>
            </BentoItem>
          </div>
        </section>

        {/* Feature List Section */}
        <section className="mb-40 grid items-center gap-20 md:grid-cols-2">
          <div>
            <span className="text-sage mb-6 block text-xs font-bold uppercase tracking-widest">
              Why Xtractify?
            </span>
            <h2 className="font-display mb-8 text-5xl font-medium tracking-tight text-foreground">
              Built for professionals who value their time.
            </h2>
            <div className="space-y-6">
              {[
                {
                  title: "Blazing Fast",
                  desc: "Optimized for speed with lightweight browser integration.",
                },
                {
                  title: "Zero Maintenance",
                  desc: "AI handles site changes so your scrapers don't break.",
                },
                {
                  title: "Security First",
                  desc: "Your data never leaves your browser unless you choose to sync.",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1 shrink-0">
                    <CheckCircle2 size={18} className="text-sage" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{item.title}</h4>
                    <p className="text-foreground/40 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="glass-card flex aspect-square flex-col justify-center gap-8 overflow-hidden rounded-[3rem] p-12 relative">
              <div className="bg-terracotta/5 absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl" />
              <div className="flex items-center gap-6">
                <div className="bg-sage shadow-sage/20 flex h-16 w-16 items-center justify-center rounded-2xl text-primary-foreground shadow-lg">
                  <Zap size={32} />
                </div>
                <div>
                  <div className="font-display text-3xl font-bold text-foreground">12.5x</div>
                  <div className="text-foreground/40 text-sm font-medium">
                    Faster than manual copying
                  </div>
                </div>
              </div>
              <div className="h-px w-full bg-foreground/5" />
              <div className="space-y-4">
                <div className="text-foreground/60 text-sm font-semibold uppercase tracking-wider">
                  Scraping Logic
                </div>
                <div className="text-foreground/40 font-mono text-xs leading-relaxed">
                  {
                    "const data = xtractify.query('article').map(node => ({\n  title: node.text(),\n  price: node.find('.price').val()\n}));"
                  }
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative mb-40 overflow-hidden rounded-[4rem] bg-black p-20 text-center">
          <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-br from-sage/20 to-transparent" />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <h2 className="font-display mb-8 text-5xl font-medium tracking-tight text-white md:text-7xl">
              Start extracting <br /> in minutes.
            </h2>
            <p className="text-white/40 mx-auto mb-12 max-w-xl text-lg">
              Join the thousands of analysts, developers, and researchers who
              trust Xtractify for their web data needs.
            </p>
            <button className="flex-inline items-center gap-3 rounded-full bg-white px-12 py-5 text-xl font-semibold text-black transition-all shadow-2xl hover:bg-white/90">
              Get Started for Free
            </button>
            <div className="mt-8 text-sm text-white/20">
              No credit card required. Cancel anytime.
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-col justify-between gap-12 px-8 py-20 border-t border-black/5 md:flex-row">
        <div className="max-w-sm">
          <div className="mb-6 flex items-center gap-2">
            <div className="bg-sage font-display flex h-8 w-8 items-center justify-center rounded-lg font-bold text-primary-foreground">
              X
            </div>
            <span className="font-display text-xl font-semibold tracking-tight text-foreground">
              Xtractify
            </span>
          </div>
          <p className="text-foreground/40 text-sm leading-relaxed mb-8">
            The world's most advanced web scraping tool. Built for humans,
            powered by intelligence.
          </p>
          <div className="flex gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-10 w-10 cursor-pointer rounded-full bg-foreground/5 transition-colors hover:bg-sage/10"
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 md:grid-cols-3">
          {[
            {
              title: "Product",
              links: ["Features", "Integrations", "Pricing", "Changelog"],
            },
            { title: "Company", links: ["About", "Blog", "Careers", "Privacy"] },
            {
              title: "Support",
              links: ["Help Center", "API Docs", "Status", "Contact"],
            },
          ].map((col, i) => (
            <div key={i}>
              <h4 className="font-display mb-6 font-semibold text-foreground">{col.title}</h4>
              <ul className="space-y-4">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a
                      href="#"
                      className="text-foreground/40 transition-colors hover:text-sage text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>

      <div className="py-10 text-center text-xs font-medium text-foreground/20 uppercase tracking-widest">
        © 2026 Xtractify Inc. Designed with intention.
      </div>
    </div>
  )
}
