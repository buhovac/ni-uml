/**
 * SVG export renderer — čita ISKLJUČIVO DiagramDocument model
 * (ne Vue Flow, ne DOM) i zajedničke definicije iz plugina.
 * Determinističan: isti dokument → isti SVG string (snapshot testovi).
 */
import {
  absolutePosition,
  anchorPoint,
  contentBounds,
  elementsById,
} from '../geometry/geometry'
import type { DiagramTypeRegistry } from '../types/definitions'
import type {
  DiagramConnection,
  DiagramDocument,
  DiagramElement,
} from '../types/document'
import { ACTOR_GEOMETRY, UML_FONT } from '../uml-use-case/definitions'
import {
  lineHeight,
  wrapText,
  
  approximateMeasurer
} from './wrap-text'
import type {TextMeasurer} from './wrap-text';

export interface ExportOptions {
  margin?: number
  background?: string | 'transparent'
  measure?: TextMeasurer
}

const esc = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const fmt = (n: number): string =>
  Number.isInteger(n) ? String(n) : n.toFixed(2)

export function exportToSvg(
  doc: DiagramDocument,
  registry: DiagramTypeRegistry,
  options: ExportOptions = {},
): string {
  const margin = options.margin ?? 24
  const measure = options.measure ?? approximateMeasurer
  const byId = elementsById(doc)
  const bounds = contentBounds(doc, byId)

  const viewX = bounds.x - margin
  const viewY = bounds.y - margin
  const viewW = bounds.width + margin * 2
  const viewH = bounds.height + margin * 2

  const parts: string[] = []
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${fmt(viewX)} ${fmt(viewY)} ${fmt(viewW)} ${fmt(viewH)}" width="${fmt(viewW)}" height="${fmt(viewH)}" font-family="${esc(UML_FONT.family)}">`,
  )
  parts.push(markerDefs())

  if (options.background && options.background !== 'transparent') {
    parts.push(
      `<rect x="${fmt(viewX)}" y="${fmt(viewY)}" width="${fmt(viewW)}" height="${fmt(viewH)}" fill="${esc(options.background)}"/>`,
    )
  }

  // Elementi po zIndexu (containeri imaju niži zIndex — BR pravilo).
  const sorted = [...doc.elements].sort((a, b) => a.zIndex - b.zIndex)

  for (const el of sorted) {
    parts.push(renderElement(el, byId, registry, measure))
  }

  for (const conn of doc.connections) {
    parts.push(renderConnection(conn, byId, registry))
  }

  parts.push('</svg>')

  return parts.join('\n')
}

/* ----------------------------- markers ---------------------------- */

function markerDefs(): string {
  return [
    '<defs>',
    // Otvoreni arrowhead (include/extend) — samo stroke, bez filla.
    '<marker id="arrow-open" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse">',
    '<path d="M 1 1 L 11 6 L 1 11" fill="none" stroke="#222222" stroke-width="1.6"/>',
    '</marker>',
    // Prazan trokut (generalization) — bijeli fill, stroke (BR12).
    '<marker id="arrow-triangle-hollow" viewBox="0 0 14 14" refX="13" refY="7" markerWidth="12" markerHeight="12" orient="auto-start-reverse">',
    '<path d="M 1 1 L 13 7 L 1 13 Z" fill="#ffffff" stroke="#222222" stroke-width="1.4"/>',
    '</marker>',
    '</defs>',
  ].join('')
}

/* ----------------------------- elements --------------------------- */

function renderElement(
  el: DiagramElement,
  byId: Map<string, DiagramElement>,
  registry: DiagramTypeRegistry,
  measure: TextMeasurer,
): string {
  const abs = absolutePosition(el, byId)
  const def = registry.nodes[el.type]
  const font = { ...UML_FONT, size: el.style.fontSize }
  const pad = def?.textPadding ?? { x: 8, y: 8 }

  switch (el.type) {
    case 'uml.use-case': {
      const cx = abs.x + el.size.width / 2
      const cy = abs.y + el.size.height / 2
      const ellipse = `<ellipse cx="${fmt(cx)}" cy="${fmt(cy)}" rx="${fmt(el.size.width / 2)}" ry="${fmt(el.size.height / 2)}" fill="${esc(el.style.fill)}" stroke="${esc(el.style.stroke)}" stroke-width="${el.style.strokeWidth}"/>`
      const text = centeredText(
        el.data.label,
        cx,
        cy,
        el.size.width - pad.x * 2,
        font,
        measure,
      )

      return group(el.id, ellipse + text)
    }

    case 'uml.actor': {
      const g = ACTOR_GEOMETRY
      const figureH = el.size.height * g.figureHeightRatio
      const cx = abs.x + el.size.width / 2
      const r = el.size.width * g.headRadiusRatio
      const headCy = abs.y + figureH * g.headCenterY + r / 2
      const neckY = headCy + r
      const shoulderYAbs = abs.y + figureH * g.shoulderY
      const hipY = abs.y + figureH * g.hipY
      const armHalf = (el.size.width * g.armSpanRatio) / 2
      const s = `stroke="${esc(el.style.stroke)}" stroke-width="${el.style.strokeWidth}" stroke-linecap="round"`
      const figure = [
        `<circle cx="${fmt(cx)}" cy="${fmt(headCy)}" r="${fmt(r)}" fill="none" ${s}/>`,
        `<line x1="${fmt(cx)}" y1="${fmt(neckY)}" x2="${fmt(cx)}" y2="${fmt(hipY)}" ${s}/>`,
        `<line x1="${fmt(cx - armHalf)}" y1="${fmt(shoulderYAbs)}" x2="${fmt(cx + armHalf)}" y2="${fmt(shoulderYAbs)}" ${s}/>`,
        `<line x1="${fmt(cx)}" y1="${fmt(hipY)}" x2="${fmt(abs.x + el.size.width * 0.15)}" y2="${fmt(abs.y + figureH)}" ${s}/>`,
        `<line x1="${fmt(cx)}" y1="${fmt(hipY)}" x2="${fmt(abs.x + el.size.width * 0.85)}" y2="${fmt(abs.y + figureH)}" ${s}/>`,
      ].join('')
      const labelY = abs.y + figureH + lineHeight(font)
      const label = `<text x="${fmt(cx)}" y="${fmt(labelY)}" text-anchor="middle" font-size="${font.size}">${esc(el.data.label)}</text>`

      return group(el.id, figure + label)
    }

    case 'uml.system-boundary': {
      const rect = `<rect x="${fmt(abs.x)}" y="${fmt(abs.y)}" width="${fmt(el.size.width)}" height="${fmt(el.size.height)}" fill="${esc(el.style.fill)}" stroke="${esc(el.style.stroke)}" stroke-width="${el.style.strokeWidth}"/>`
      const label = `<text x="${fmt(abs.x + el.size.width / 2)}" y="${fmt(abs.y + pad.y + font.size)}" text-anchor="middle" font-size="${font.size}" font-weight="600">${esc(el.data.label)}</text>`

      return group(el.id, rect + label)
    }

    case 'uml.note': {
      const fold = 14
      const { x, y } = abs
      const w = el.size.width
      const h = el.size.height
      const body = `<path d="M ${fmt(x)} ${fmt(y)} H ${fmt(x + w - fold)} L ${fmt(x + w)} ${fmt(y + fold)} V ${fmt(y + h)} H ${fmt(x)} Z" fill="${esc(el.style.fill)}" stroke="${esc(el.style.stroke)}" stroke-width="${el.style.strokeWidth}"/>`
      const corner = `<path d="M ${fmt(x + w - fold)} ${fmt(y)} V ${fmt(y + fold)} H ${fmt(x + w)}" fill="none" stroke="${esc(el.style.stroke)}" stroke-width="${el.style.strokeWidth}"/>`
      const lines = wrapText(el.data.text, w - pad.x * 2, font, measure)
      const lh = lineHeight(font)
      const text = lines
        .map(
          (line, i) =>
            `<text x="${fmt(x + pad.x)}" y="${fmt(y + pad.y + font.size + i * lh)}" font-size="${font.size}">${esc(line)}</text>`,
        )
        .join('')

      return group(el.id, body + corner + text)
    }
  }
}

function centeredText(
  raw: string,
  cx: number,
  cy: number,
  maxWidth: number,
  font: { family: string; size: number; weight?: number; lineHeightFactor: number },
  measure: TextMeasurer,
): string {
  const lines = wrapText(raw, maxWidth, font, measure)
  const lh = lineHeight(font)
  const totalH = lines.length * lh
  const firstBaseline = cy - totalH / 2 + font.size * 0.85
  const tspans = lines
    .map(
      (line, i) =>
        `<tspan x="${fmt(cx)}" y="${fmt(firstBaseline + i * lh)}">${esc(line)}</tspan>`,
    )
    .join('')

  return `<text text-anchor="middle" font-size="${font.size}">${tspans}</text>`
}

function group(id: string, inner: string): string {
  return `<g data-element-id="${esc(id)}">${inner}</g>`
}

/* --------------------------- connections -------------------------- */

function renderConnection(
  conn: DiagramConnection,
  byId: Map<string, DiagramElement>,
  registry: DiagramTypeRegistry,
): string {
  const source = byId.get(conn.source.elementId)
  const target = byId.get(conn.target.elementId)

  if (!source || !target) {
return `<!-- dangling connection ${esc(conn.id)} -->`
}

  const p1 = anchorPoint(source, conn.source.anchorId, byId, registry)
  const p2 = anchorPoint(target, conn.target.anchorId, byId, registry)

  const edgeDef = registry.edges[conn.type]
  const style = conn.style
  const dash = style.dash ? ` stroke-dasharray="${style.dash.join(' ')}"` : ''
  const marker =
    style.arrowEnd === 'open'
      ? ' marker-end="url(#arrow-open)"'
      : style.arrowEnd === 'triangle-hollow'
        ? ' marker-end="url(#arrow-triangle-hollow)"'
        : ''

  const line = `<line x1="${fmt(p1.x)}" y1="${fmt(p1.y)}" x2="${fmt(p2.x)}" y2="${fmt(p2.y)}" stroke="${esc(style.stroke)}" stroke-width="${style.strokeWidth}"${dash}${marker}/>`

  // Labele: eksplicitne + automatska UML labela iz definicije.
  const labels = [...conn.labels]

  if (edgeDef?.umlLabel && !labels.some((l) => l.text === edgeDef.umlLabel)) {
    labels.push({ text: edgeDef.umlLabel, position: 0.5 })
  }

  const labelSvg = labels
    .map((l) => {
      const lx = p1.x + (p2.x - p1.x) * l.position
      const ly = p1.y + (p2.y - p1.y) * l.position - 6

      return `<text x="${fmt(lx)}" y="${fmt(ly)}" text-anchor="middle" font-size="${UML_FONT.size - 1}" font-style="italic">${esc(l.text)}</text>`
    })
    .join('')

  return `<g data-connection-id="${esc(conn.id)}">${line}${labelSvg}</g>`
}
