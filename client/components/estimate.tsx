"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ArrowRight, CalendarDays, Check, Copy, Download, Loader2, MessageCircle, Pencil, Printer, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { allItems, eur, proposal, sections, timeline, type Item, type Section } from "@/lib/proposal"
import { decodeSnapshot, shareUrl, type Snapshot } from "@/lib/share"

const STORAGE_KEY = "nimbkids-estimate-v2"

const sectionOf = Object.fromEntries(allItems.map((i) => [i.id, i.section.billing]))
const initialSelected = () => Object.fromEntries(allItems.map((i) => [i.id, !!i.suggested]))
const initialPrices = () => Object.fromEntries(allItems.map((i) => [i.id, String(i.price)]))

const toNumber = (v: string | null | undefined) => {
  const n = parseFloat((v ?? "").replace(",", "."))
  return Number.isFinite(n) && n >= 0 ? n : 0
}
const cleanNumber = (v: string) => v.replace(/[^\d.,]/g, "")
const priceText = (n: number) => (n === 0 ? "Included" : eur(n))

type Totals = { core: number; addons: number; calculated: number; final: number; monthly: number; count: number; overridden: boolean }

function computeTotals(selected: Record<string, boolean>, prices: Record<string, string>, total: string | null): Totals {
  const sum = (pred: (i: (typeof allItems)[number]) => boolean) =>
    allItems.filter((i) => selected[i.id] && pred(i)).reduce((a, i) => a + toNumber(prices[i.id]), 0)
  const core = sum((i) => i.section.id === "core")
  const addons = sum((i) => i.section.id === "addons")
  const calculated = core + addons
  const overridden = total !== null && total.trim() !== "" && toNumber(total) !== calculated
  return {
    core,
    addons,
    calculated,
    final: overridden ? toNumber(total) : calculated,
    monthly: sum((i) => i.section.billing === "monthly"),
    count: allItems.filter((i) => selected[i.id]).length,
    overridden,
  }
}

export function Estimate() {
  const [selected, setSelected] = useState<Record<string, boolean>>(initialSelected)
  const [prices, setPrices] = useState<Record<string, string>>(initialPrices)
  const [total, setTotal] = useState<string | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [shared, setShared] = useState<Snapshot | null>(null)
  const [loaded, setLoaded] = useState(false)

  // After hydration: open a shared selection from the URL, or restore this browser's draft.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("s")
    if (code) {
      const snap = decodeSnapshot(code)
      if (snap) setShared(snap)
      else toast.error("This link looks broken or incomplete")
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const d = JSON.parse(raw)
          if (d.selected) setSelected((s) => ({ ...s, ...d.selected }))
          if (d.prices) setPrices((p) => ({ ...p, ...d.prices }))
          if (typeof d.total === "string") setTotal(d.total)
        }
      } catch {}
    }
    setLoaded(true)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!loaded || shared) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ selected, prices, total }))
    } catch {}
  }, [selected, prices, total, loaded, shared])

  const totals = useMemo(() => computeTotals(selected, prices, total), [selected, prices, total])

  if (!loaded) return <Shell />
  if (shared) return <SharedView snap={shared} />

  const toggle = (item: Item, checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev, [item.id]: checked }
      if (checked) {
        item.requires?.forEach((id) => (next[id] = true))
      } else if (sectionOf[item.id] !== "external") {
        // Untick anything that can't work without this item.
        allItems.forEach((other) => {
          if (other.requires?.includes(item.id)) next[other.id] = false
        })
      }
      return next
    })
  }

  const reset = () => {
    setSelected(initialSelected())
    setPrices(initialPrices())
    setTotal(null)
    toast("Reset to the suggested package")
  }

  const openReview = () => {
    if (totals.count === 0) return toast.error("Tick at least one item")
    setReviewOpen(true)
  }

  const finish = () => {
    // Go to the finished page; its URL carries the whole selection.
    window.location.assign(shareUrl({ selected, prices, total: totals.overridden ? total : null, finishedAt: new Date().toISOString() }))
  }

  const scrollToFinal = () => document.getElementById("final")?.scrollIntoView({ behavior: "smooth" })

  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-6 sm:pt-14">
        <p className="text-sm font-semibold text-teal">{proposal.place}</p>
        <h1 className="mt-2 font-serif text-3xl leading-tight font-semibold text-balance sm:text-5xl">
          Financial Proposal: {proposal.project}
        </h1>
        <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">nimbkids.al</span> {proposal.intro.replace(/^A/, "is a")}
        </p>
        <div className="mt-6 rounded-lg border border-teal/30 bg-teal-soft px-4 py-3 text-sm">
          Tick what you want. Prices and the total are editable. When you&apos;re done, press{" "}
          <span className="font-semibold">Finish</span> at the bottom.
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-32 lg:grid-cols-[1fr_320px] lg:pb-16">
        <div className="min-w-0 space-y-10">
          {sections.map((s) => (
            <SectionBlock
              key={s.id}
              section={s}
              selected={selected}
              prices={prices}
              onToggle={toggle}
              onPrice={(id, v) => setPrices((p) => ({ ...p, [id]: v }))}
              onSelectAll={(checked) =>
                setSelected((prev) => {
                  const next = { ...prev }
                  s.items.forEach((i) => {
                    next[i.id] = checked
                    if (checked) i.requires?.forEach((r) => (next[r] = true))
                  })
                  return next
                })
              }
            />
          ))}

          <TimelineBlock />

          {/* Final price + finish */}
          <section id="final" className="scroll-mt-24">
            <SectionHeading number={6} title="Final Price" subtitle="Calculated from your selection. You can change the total if needed." />
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="space-y-2 p-5 text-sm">
                <Row label="Core Package" value={eur(totals.core)} />
                <Row label="Optional Add-ons" value={eur(totals.addons)} />
                <Row label="Calculated total" value={eur(totals.calculated)} />
                <Row label="Maintenance" value={totals.monthly ? `${eur(totals.monthly)} / month` : "Not selected"} />
              </div>
              <div className="flex flex-col gap-3 bg-teal-soft p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label htmlFor="total" className="font-serif text-lg font-semibold">
                    Total (one-time, excl. VAT)
                  </label>
                  {totals.overridden && (
                    <p className="text-xs text-muted-foreground">
                      Edited · calculated was <span className="line-through">{eur(totals.calculated)}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {totals.overridden && (
                    <Button variant="ghost" size="icon" onClick={() => setTotal(null)} aria-label="Reset total to calculated" title="Reset to calculated">
                      <RotateCcw />
                    </Button>
                  )}
                  <div className="relative w-44">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">€</span>
                    <Input
                      id="total"
                      inputMode="decimal"
                      value={total ?? String(totals.calculated)}
                      onChange={(e) => {
                        const v = cleanNumber(e.target.value)
                        // Typing the calculated amount back means "not edited" again.
                        setTotal(v !== "" && toNumber(v) === totals.calculated ? null : v)
                      }}
                      onFocus={(e) => e.target.select()}
                      className={cn("h-12 bg-card pl-7 text-right font-serif text-xl font-semibold tabular-nums", totals.overridden && "border-teal ring-1 ring-teal/30")}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" onClick={reset} className="text-muted-foreground">
                <RotateCcw /> Reset to suggested
              </Button>
              <Button size="lg" onClick={openReview} className="h-12 bg-teal px-6 text-base text-white hover:bg-teal/90">
                Finish · {eur(totals.final)} <ArrowRight />
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground sm:text-right">
              All prices are fixed and exclude VAT. Add-ons can be chosen individually, at launch or later.
            </p>
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-6 overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="bg-navy px-5 py-4 text-white">
              <p className="text-xs tracking-wider text-white/60 uppercase">Your estimate</p>
              <p className="mt-1 font-serif text-3xl font-semibold tabular-nums">{eur(totals.final)}</p>
              <p className="text-xs text-white/60">one-time · excl. VAT{totals.overridden && " · edited"}</p>
            </div>
            <div className="space-y-2 p-5 text-sm">
              <Row label="Core Package" value={eur(totals.core)} />
              <Row label="Add-ons" value={eur(totals.addons)} />
              {totals.overridden && <Row label="Calculated" value={eur(totals.calculated)} />}
              <Separator className="my-3" />
              <Row label="Total" value={eur(totals.final)} strong />
              <Row label="Maintenance" value={totals.monthly ? `${eur(totals.monthly)}/mo` : "—"} />
              <p className="pt-2 text-xs text-muted-foreground">{totals.count} items selected</p>
              <Button variant="outline" className="mt-2 w-full" onClick={scrollToFinal}>
                <Pencil /> Edit total
              </Button>
              <Button onClick={openReview} className="h-11 w-full bg-teal text-white hover:bg-teal/90">
                Finish <ArrowRight />
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile total bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-navy px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-white lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <button type="button" className="min-w-0 text-left" onClick={scrollToFinal}>
            <p className="text-xs text-white/60">
              {totals.count} items · excl. VAT · <span className="underline">edit</span>
            </p>
            <p className="truncate text-lg font-semibold tabular-nums">
              {eur(totals.final)}
              {totals.monthly > 0 && <span className="text-sm font-normal text-white/70"> + {eur(totals.monthly)}/mo</span>}
            </p>
          </button>
          <Button onClick={openReview} className="h-10 bg-teal px-4 text-white hover:bg-teal/90">
            Finish <ArrowRight />
          </Button>
        </div>
      </div>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Review your selection</DialogTitle>
            <DialogDescription>Check everything, then press Finish.</DialogDescription>
          </DialogHeader>
          <SelectionList selected={selected} prices={prices} totals={totals} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>
              Keep editing
            </Button>
            <Button onClick={finish} className="bg-teal text-white hover:bg-teal/90">
              <Check /> Finish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Shell>
  )
}

/** Read-only page shown when someone opens a finished link. */
function SharedView({ snap }: { snap: Snapshot }) {
  const totals = computeTotals(snap.selected, snap.prices, snap.total)
  const date = new Date(snap.finishedAt)
  const when = Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })

  return (
    <Shell>
      <FinishedToolbar snap={snap} totals={totals} when={when} />
      <section className="mx-auto max-w-3xl px-4 pt-8 pb-16 sm:pt-10">
        <Badge className="bg-teal text-white">Finished selection</Badge>
        <h1 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">{proposal.project}</h1>
        {when && <p className="mt-1 text-sm text-muted-foreground">Finished on {when}</p>}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Total (one-time)" value={eur(totals.final)} hint={totals.overridden ? `edited · calculated ${eur(totals.calculated)}` : "excl. VAT"} />
          <Stat label="Maintenance" value={totals.monthly ? `${eur(totals.monthly)}/mo` : "—"} hint={totals.monthly ? "monthly" : "not selected"} />
          <Stat label="Items" value={String(totals.count)} hint={`of ${allItems.length}`} />
        </div>

        <div className="mt-8 space-y-8">
          {sections.map((s) => {
            const picked = s.items.filter((i) => snap.selected[i.id])
            const skipped = s.items.filter((i) => !snap.selected[i.id])
            return (
              <div key={s.id}>
                <SectionHeading number={s.number} title={s.title} subtitle={`${picked.length} of ${s.items.length} selected`} />
                <div className="overflow-hidden rounded-xl border bg-card">
                  <ul className="divide-y">
                    {picked.map((i) => {
                      const p = toNumber(snap.prices[i.id])
                      const edited = s.billing !== "external" && p !== i.price
                      return (
                        <li key={i.id} className="flex items-start justify-between gap-4 px-4 py-3">
                          <span className="flex items-start gap-2.5">
                            <Check className="mt-0.5 size-4 shrink-0 text-teal" />
                            <span>
                              <span className="font-medium">{i.title}</span>
                              <span className="block text-xs text-muted-foreground">{i.description}</span>
                            </span>
                          </span>
                          <span className="shrink-0 text-right text-sm tabular-nums">
                            {s.billing === "external" ? i.priceLabel : `${priceText(p)}${s.billing === "monthly" ? "/mo" : ""}`}
                            {edited && <span className="block text-xs text-muted-foreground line-through">{eur(i.price)}</span>}
                          </span>
                        </li>
                      )
                    })}
                    {picked.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">Nothing selected</li>}
                  </ul>
                  {skipped.length > 0 && (
                    <p className="border-t bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
                      Not selected: {skipped.map((i) => i.title).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 flex justify-center sm:justify-end print:hidden">
          <Button nativeButton={false} render={<a href={window.location.pathname} />} className="bg-teal text-white hover:bg-teal/90">
            Start a new estimate <ArrowRight />
          </Button>
        </div>
      </section>
    </Shell>
  )
}

function FinishedToolbar({ snap, totals, when }: { snap: Snapshot; totals: Totals; when: string }) {
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const link = typeof window === "undefined" ? "" : window.location.href

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy. Copy the address from the browser bar instead.")
    }
  }
  const download = async () => {
    setBusy(true)
    try {
      const { downloadPdf } = await import("@/lib/pdf")
      await downloadPdf(snap, totals, when)
    } catch {
      toast.error("Couldn't create the PDF. Try Print → Save as PDF instead.")
    } finally {
      setBusy(false)
    }
  }
  const message = `I finished my nimbkids.al selection: ${eur(totals.final)}${totals.monthly ? ` + ${eur(totals.monthly)}/month` : ""}.\n${link}`

  return (
    <div className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4 py-3">
        <p className="mr-auto flex items-center gap-2 text-sm font-medium">
          <span className="grid size-6 place-items-center rounded-full bg-teal text-white">
            <Check className="size-3.5" />
          </span>
          Finished
        </p>
        <Button variant="outline" onClick={copy}>
          {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy link"}
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer /> Print
        </Button>
        <Button onClick={download} disabled={busy} className="bg-teal text-white hover:bg-teal/90">
          {busy ? <Loader2 className="animate-spin" /> : <Download />} Download PDF
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          size="icon"
          aria-label="Send link on WhatsApp"
          title="Send link on WhatsApp"
          render={<a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" />}
        >
          <MessageCircle />
        </Button>
      </div>
    </div>
  )
}

function SelectionList({ selected, prices, totals }: { selected: Record<string, boolean>; prices: Record<string, string>; totals: Totals }) {
  return (
    <div className="space-y-4 text-sm">
      {sections.map((s) => {
        const picked = s.items.filter((i) => selected[i.id])
        if (!picked.length) return null
        return (
          <div key={s.id}>
            <p className="mb-1.5 font-semibold">{s.title}</p>
            <ul className="space-y-1">
              {picked.map((i) => (
                <li key={i.id} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{i.title}</span>
                  <span className="shrink-0 tabular-nums">
                    {s.billing === "external" ? i.priceLabel : `${priceText(toNumber(prices[i.id]))}${s.billing === "monthly" ? "/mo" : ""}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      <Separator />
      {totals.overridden && <Row label="Calculated" value={eur(totals.calculated)} />}
      <Row label="Total (one-time)" value={eur(totals.final)} strong />
      {totals.monthly > 0 && <Row label="Monthly maintenance" value={`${eur(totals.monthly)}/mo`} />}
    </div>
  )
}

function Shell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-navy print:hidden">
        <div className="flex h-20 items-center justify-center sm:h-24">
          <span className="text-lg font-light tracking-[0.3em] text-white uppercase sm:text-xl">Project Estimate</span>
        </div>
        <div className="h-3 bg-teal" />
        <div className="h-2 bg-navy" />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}

function TimelineBlock() {
  return (
    <section>
      <SectionHeading number={5} title="Development Plan" subtitle="Approx. 1 month from signing, depending on add-ons and receiving product files and photos on time." />
      <ol className="grid gap-3 sm:grid-cols-2">
        {timeline.map((t) => (
          <li key={t.week} className="rounded-lg border bg-card p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-teal">
              <CalendarDays className="size-4" /> {t.week}
            </p>
            <p className="mt-1 text-sm">{t.work}</p>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-muted-foreground">Online card payments go live once Raiffeisen Bank approves the merchant account.</p>
    </section>
  )
}

function SectionHeading({ number, title, subtitle }: { number: number; title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-serif text-2xl font-semibold">
        <span className="text-teal">{number}.</span> {title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function SectionBlock({
  section,
  selected,
  prices,
  onToggle,
  onPrice,
  onSelectAll,
}: {
  section: Section
  selected: Record<string, boolean>
  prices: Record<string, string>
  onToggle: (item: Item, checked: boolean) => void
  onPrice: (id: string, v: string) => void
  onSelectAll: (checked: boolean) => void
}) {
  const picked = section.items.filter((i) => selected[i.id])
  const allPicked = picked.length === section.items.length
  const subtotal = picked.reduce((a, i) => a + toNumber(prices[i.id]), 0)
  // List price of the ticked items, to show a strikethrough when prices were edited.
  const listTotal = picked.reduce((a, i) => a + i.price, 0)

  return (
    <section>
      <SectionHeading number={section.number} title={section.title} subtitle={section.subtitle} />
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-3 bg-teal px-4 py-2.5 text-sm font-semibold text-navy">
          <span className="italic">Feature</span>
          <div className="flex items-center gap-3">
            {section.items.length > 1 && (
              <button type="button" onClick={() => onSelectAll(!allPicked)} className="rounded px-2 py-0.5 text-xs font-medium underline-offset-2 hover:underline">
                {allPicked ? "Clear all" : "Select all"}
              </button>
            )}
            <span className="italic">{section.billing === "monthly" ? "€ / month" : section.billing === "external" ? "Approx. cost" : "Cost (€)"}</span>
          </div>
        </div>
        <ul className="divide-y">
          {section.items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              billing={section.billing}
              checked={!!selected[item.id]}
              price={prices[item.id] ?? ""}
              onToggle={(c) => onToggle(item, c)}
              onPrice={(v) => onPrice(item.id, v)}
            />
          ))}
        </ul>
        {section.billing !== "external" && (
          <div className="flex items-center justify-between bg-teal-soft px-4 py-3 text-sm font-semibold">
            <span>
              {section.billing === "monthly" ? "Monthly" : `Total ${section.title}`}{" "}
              <span className="font-normal text-muted-foreground">
                ({picked.length}/{section.items.length} selected)
              </span>
            </span>
            <span className="tabular-nums">
              {eur(subtotal)}
              {subtotal !== listTotal && <span className="ml-2 font-normal text-muted-foreground line-through">{eur(listTotal)}</span>}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

function ItemRow({
  item,
  billing,
  checked,
  price,
  onToggle,
  onPrice,
}: {
  item: Item
  billing: Section["billing"]
  checked: boolean
  price: string
  onToggle: (checked: boolean) => void
  onPrice: (v: string) => void
}) {
  const edited = billing !== "external" && toNumber(price) !== item.price
  return (
    <li className={cn("flex flex-col gap-3 px-4 py-3.5 transition-colors sm:flex-row sm:items-start", checked ? "bg-card" : "bg-muted/40")}>
      <label className="flex flex-1 cursor-pointer items-start gap-3">
        <Checkbox checked={checked} onCheckedChange={(c) => onToggle(!!c)} className="mt-0.5 size-5 data-checked:border-teal data-checked:bg-teal" />
        <span className="min-w-0">
          <span className={cn("flex flex-wrap items-center gap-2 font-semibold", !checked && "text-muted-foreground")}>
            {item.title}
            {item.suggested && billing !== "external" && (
              <Badge variant="secondary" className="bg-teal-soft text-[11px] text-teal">
                Suggested
              </Badge>
            )}
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">{item.description}</span>
          {item.note && <span className="mt-1 block text-xs font-medium text-amber-700">{item.note}</span>}
        </span>
      </label>

      <div className="flex items-center gap-2 pl-8 sm:w-40 sm:justify-end sm:pl-0">
        {billing === "external" ? (
          <span className="text-sm whitespace-nowrap">{item.priceLabel}</span>
        ) : (
          <>
            {edited && (
              <button
                type="button"
                onClick={() => onPrice(String(item.price))}
                className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                title={`Reset to ${eur(item.price)}`}
                aria-label={`Reset ${item.title} price to ${eur(item.price)}`}
              >
                <RotateCcw className="size-3.5" />
              </button>
            )}
            <div className="relative w-28">
              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">€</span>
              <Input
                inputMode="decimal"
                aria-label={`${item.title} price`}
                value={price}
                onChange={(e) => onPrice(cleanNumber(e.target.value))}
                onFocus={(e) => e.target.select()}
                className={cn("h-9 pl-6 text-right text-base tabular-nums sm:text-sm", edited && "border-teal ring-1 ring-teal/30", !checked && "opacity-60")}
              />
            </div>
          </>
        )}
      </div>
    </li>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between", strong && "text-base font-semibold")}>
      <span className={cn(!strong && "text-muted-foreground")}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
