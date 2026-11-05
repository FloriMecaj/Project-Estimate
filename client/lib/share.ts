import { allItems } from "@/lib/proposal"

/**
 * The client's finished selection, packed into the page URL (?s=...).
 * No server or database: whoever opens the link sees exactly what was ticked.
 */
export type Snapshot = {
  selected: Record<string, boolean>
  prices: Record<string, string>
  /** Manually edited one-time total, if any. */
  total: string | null
  /** ISO date the client pressed Finish. */
  finishedAt: string
}

type Packed = { v: 1; s: string[]; p: Record<string, number>; t?: number; d: string }

const toB64Url = (str: string) => btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
const fromB64Url = (str: string) => atob(str.replace(/-/g, "+").replace(/_/g, "/"))

export function encodeSnapshot(snap: Snapshot): string {
  const packed: Packed = {
    v: 1,
    // Ticked item ids (ids, not positions, so links survive edits to the proposal).
    s: allItems.filter((i) => snap.selected[i.id]).map((i) => i.id),
    // Only prices that differ from the proposal.
    p: Object.fromEntries(
      allItems
        .map((i) => [i.id, parseFloat((snap.prices[i.id] ?? "").replace(",", "."))] as const)
        .filter(([id, n]) => Number.isFinite(n) && n !== allItems.find((i) => i.id === id)!.price),
    ),
    d: snap.finishedAt,
  }
  const total = parseFloat((snap.total ?? "").replace(",", "."))
  if (snap.total !== null && Number.isFinite(total)) packed.t = total
  return toB64Url(JSON.stringify(packed))
}

export function decodeSnapshot(code: string): Snapshot | null {
  try {
    const packed = JSON.parse(fromB64Url(code)) as Packed
    if (packed.v !== 1 || !Array.isArray(packed.s)) return null
    return {
      selected: Object.fromEntries(allItems.map((i) => [i.id, packed.s.includes(i.id)])),
      prices: Object.fromEntries(allItems.map((i) => [i.id, String(packed.p?.[i.id] ?? i.price)])),
      total: typeof packed.t === "number" ? String(packed.t) : null,
      finishedAt: packed.d,
    }
  } catch {
    return null
  }
}

export function shareUrl(snap: Snapshot) {
  const url = new URL(window.location.href)
  url.search = `?s=${encodeSnapshot(snap)}`
  url.hash = ""
  return url.toString()
}
