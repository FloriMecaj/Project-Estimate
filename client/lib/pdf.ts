import { eur, proposal, sections } from "@/lib/proposal"
import type { Snapshot } from "@/lib/share"

type Totals = { core: number; addons: number; calculated: number; final: number; monthly: number; count: number; overridden: boolean }

const NAVY: [number, number, number] = [16, 21, 44]
const TEAL: [number, number, number] = [59, 188, 176]
const TEAL_SOFT: [number, number, number] = [230, 246, 244]
const MUTED: [number, number, number] = [91, 97, 120]

const toNumber = (v: string | undefined) => {
  const n = parseFloat((v ?? "").replace(",", "."))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

/** Builds the finished selection as a PDF in the browser and downloads it. */
export async function downloadPdf(snap: Snapshot, totals: Totals, finishedOn: string) {
  const doc = await buildPdf(snap, totals, finishedOn)
  const date = snap.finishedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10)
  doc.save(`nimbkids-estimate-${date}.pdf`)
}

export async function buildPdf(snap: Snapshot, totals: Totals, finishedOn: string) {
  // Loaded on demand so the editor page stays light.
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")])
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const W = doc.internal.pageSize.getWidth()
  const M = 48

  const header = () => {
    doc.setFillColor(...NAVY).rect(0, 0, W, 54, "F")
    doc.setFillColor(...TEAL).rect(0, 54, W, 8, "F")
    doc.setFillColor(...NAVY).rect(0, 62, W, 5, "F")
    doc.setTextColor(255, 255, 255).setFont("helvetica", "normal").setFontSize(12)
    doc.text("P R O J E C T   E S T I M A T E", W / 2, 33, { align: "center" })
  }
  header()

  let y = 100
  doc.setTextColor(...NAVY).setFont("times", "bold").setFontSize(22)
  doc.text(proposal.project, M, y)
  y += 18
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...MUTED)
  doc.text(finishedOn ? `Finished selection · ${finishedOn}` : "Finished selection", M, y)
  y += 18

  // Totals
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, top: 90 },
    theme: "grid",
    rowPageBreak: "avoid",
    styles: { font: "helvetica", fontSize: 10, lineColor: [210, 214, 224], textColor: NAVY, cellPadding: 6 },
    headStyles: { fillColor: TEAL, textColor: NAVY, fontStyle: "bolditalic" },
    columnStyles: { 1: { halign: "right", cellWidth: 140 } },
    head: [["Summary", { content: "Cost (EUR)", styles: { halign: "right" } }]],
    body: [
      ["Core Package", eur(totals.core)],
      ["Optional Add-ons", eur(totals.addons)],
      ...(totals.overridden ? [["Calculated total", eur(totals.calculated)]] : []),
      [{ content: "Total (one-time, excl. VAT)", styles: { fontStyle: "bold", fillColor: TEAL_SOFT } }, { content: eur(totals.final), styles: { fontStyle: "bold", fillColor: TEAL_SOFT } }],
      ["Maintenance", totals.monthly ? `${eur(totals.monthly)} / month` : "Not selected"],
    ],
  })

  for (const s of sections) {
    const picked = s.items.filter((i) => snap.selected[i.id])
    const skipped = s.items.filter((i) => !snap.selected[i.id])
    const startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 26
    doc.setFont("times", "bold").setFontSize(14).setTextColor(...NAVY)
    doc.text(`${s.number}. ${s.title}  `, M, startY)
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...MUTED)
    doc.text(`${picked.length} of ${s.items.length} selected`, W - M, startY, { align: "right" })

    const body = picked.map((i) => {
      const p = toNumber(snap.prices[i.id])
      const edited = s.billing !== "external" && p !== i.price
      const price =
        s.billing === "external"
          ? (i.priceLabel ?? "")
          : `${p === 0 ? "Included" : eur(p)}${s.billing === "monthly" ? " / month" : ""}${edited ? `\n(list ${eur(i.price)})` : ""}`
      return [{ content: `${i.title}\n${i.description}` }, price]
    })
    if (!body.length) body.push([{ content: "Nothing selected" }, ""])

    autoTable(doc, {
      startY: startY + 8,
      margin: { left: M, right: M, top: 90 },
      theme: "grid",
      rowPageBreak: "avoid",
      styles: { font: "helvetica", fontSize: 9, lineColor: [210, 214, 224], textColor: NAVY, cellPadding: 6, valign: "top" },
      headStyles: { fillColor: TEAL, textColor: NAVY, fontStyle: "bolditalic" },
      columnStyles: { 1: { halign: "right", cellWidth: 140 } },
      head: [["Feature", s.billing === "external" ? "Approx. cost" : s.billing === "monthly" ? "Cost (EUR / month)" : "Cost (EUR)"]],
      body,
      foot: skipped.length ? [[{ content: `Not selected: ${skipped.map((i) => i.title).join(", ")}`, colSpan: 2 }]] : undefined,
      footStyles: { fillColor: [244, 245, 248], textColor: MUTED, fontStyle: "normal", fontSize: 8 },
      showFoot: "lastPage",
      // Title in bold on the first line, description below it. An empty first
      // line reserves the space; didDrawCell paints the bold title into it.
      didParseCell: (data) => {
        if (data.section === "head" && data.column.index === 1) data.cell.styles.halign = "right"
        if (data.section !== "body" || data.column.index !== 0 || data.cell.text.length < 2) return
        const [title, ...desc] = data.cell.text
        ;(data.cell as unknown as { title: string }).title = title
        data.cell.text = ["", ...desc]
        data.cell.styles.textColor = MUTED
      },
      didDrawCell: (data) => {
        const title = (data.cell as unknown as { title?: string }).title
        if (data.section !== "body" || data.column.index !== 0 || !title) return
        doc.setFont("helvetica", "bold").setFontSize(9.5).setTextColor(...NAVY)
        doc.text(title, data.cell.x + data.cell.padding("left"), data.cell.y + data.cell.padding("top") + 8)
      },
      didDrawPage: () => header(),
    })
  }

  const end = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22
  doc.setFont("helvetica", "italic").setFontSize(8.5).setTextColor(...MUTED)
  doc.text("All prices exclude VAT. Running costs are paid directly to the providers.", M, end)

  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFillColor(...TEAL).rect(M, doc.internal.pageSize.getHeight() - 36, W - 2 * M, 1.5, "F")
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...MUTED)
    doc.text(`${p} / ${pages}`, W - M, doc.internal.pageSize.getHeight() - 22, { align: "right" })
  }

  return doc
}
