import { describe, expect, it } from 'vitest'
import { exportToSvg } from '../export/svg-exporter'
import {
  parseDocument,
  serializeDocument,
} from '../serialization/serializer'
import {
  createEmptyDocument
  
} from '../types/document'
import type {DiagramDocument} from '../types/document';
import { umlUseCaseRegistry } from '../uml-use-case/definitions'

function sampleDocument(): DiagramDocument {
  const doc = createEmptyDocument('Aquatic Adventures System')
  doc.elements.push(
    {
      id: 'b1',
      type: 'uml.system-boundary',
      position: { x: 260, y: 40 },
      size: { width: 420, height: 320 },
      zIndex: 1,
      style: { fill: '#fafafa', stroke: '#222222', strokeWidth: 1.5, fontSize: 15 },
      data: { label: 'Aquatic Adventures' },
    },
    {
      id: 'a1',
      type: 'uml.actor',
      position: { x: 60, y: 130 },
      size: { width: 70, height: 110 },
      zIndex: 10,
      style: { fill: 'none', stroke: '#222222', strokeWidth: 2, fontSize: 14 },
      data: { label: 'Klijent' },
    },
    {
      id: 'u1',
      type: 'uml.use-case',
      parentId: 'b1',
      position: { x: 40, y: 60 }, // relativno prema b1
      size: { width: 170, height: 80 },
      zIndex: 10,
      style: { fill: '#ffffff', stroke: '#222222', strokeWidth: 2, fontSize: 14 },
      data: { label: 'Book Charter' },
    },
    {
      id: 'u2',
      type: 'uml.use-case',
      parentId: 'b1',
      position: { x: 40, y: 200 },
      size: { width: 170, height: 80 },
      zIndex: 10,
      style: { fill: '#ffffff', stroke: '#222222', strokeWidth: 2, fontSize: 14 },
      data: { label: 'Verify Payment Details' },
    },
  )
  doc.connections.push(
    {
      id: 'c1',
      type: 'uml.association',
      source: { elementId: 'a1', anchorId: 'right' },
      target: { elementId: 'u1', anchorId: 'left' },
      routing: { type: 'straight', points: [] },
      labels: [],
      style: { stroke: '#222222', strokeWidth: 2, arrowEnd: 'none' },
    },
    {
      id: 'c2',
      type: 'uml.include',
      source: { elementId: 'u1', anchorId: 'bottom' },
      target: { elementId: 'u2', anchorId: 'top' },
      routing: { type: 'straight', points: [] },
      labels: [],
      style: {
        stroke: '#222222',
        strokeWidth: 2,
        dash: [6, 4],
        arrowEnd: 'open',
      },
    },
  )

  return doc
}

describe('SVG exporter', () => {
  it('je determinističan i sadrži očekivane UML strukture', () => {
    const doc = sampleDocument()
    const svg1 = exportToSvg(doc, umlUseCaseRegistry)
    const svg2 = exportToSvg(doc, umlUseCaseRegistry)
    expect(svg1).toBe(svg2)

    expect(svg1).toContain('<ellipse') // use case
    expect(svg1).toContain('<circle') // glava actora
    expect(svg1).toContain('stroke-dasharray="6 4"') // include je dashed
    expect(svg1).toContain('url(#arrow-open)') // include arrowhead
    expect(svg1).toContain('&lt;&lt;include&gt;&gt;') // automatska UML labela
    expect(svg1).toContain('Book Charter')
  })

  it('razrješava relativnu poziciju djeteta u apsolutnu', () => {
    const doc = sampleDocument()
    const svg = exportToSvg(doc, umlUseCaseRegistry)
    // u1: boundary(260,40) + relativno(40,60) + pola veličine (85,40) → cx=385, cy=140
    expect(svg).toContain('cx="385" cy="140"')
  })

  it('serialize → parse roundtrip čuva dokument', () => {
    const doc = sampleDocument()
    const result = parseDocument(serializeDocument(doc))
    expect(result.ok).toBe(true)
    expect(result.document).toEqual(doc)
  })
})
