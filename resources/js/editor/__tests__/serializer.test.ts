import { describe, expect, it } from 'vitest'
import { validateReferentialIntegrity } from '../serialization/referential-integrity'
import { parseDocument, serializeDocument } from '../serialization/serializer'
import { createEmptyDocument } from '../types/document'
import type { ActorElement, DiagramConnection } from '../types/document'

const actor = (id: string): ActorElement => ({
  id,
  type: 'uml.actor',
  position: { x: 40, y: 40 },
  size: { width: 70, height: 110 },
  zIndex: 10,
  style: { fill: 'none', stroke: '#222', strokeWidth: 2, fontSize: 14 },
  data: { label: 'Korisnik' },
})

const association = (id: string, from: string, to: string): DiagramConnection => ({
  id,
  type: 'uml.association',
  source: { elementId: from, anchorId: 'right' },
  target: { elementId: to, anchorId: 'left' },
  routing: { type: 'straight', points: [] },
  labels: [],
  style: { stroke: '#222', strokeWidth: 2, arrowEnd: 'none' },
})

describe('parseDocument (Ajv shema)', () => {
  it('roundtrip: parse(serialize(doc)) daje semantički identičan dokument', () => {
    const doc = createEmptyDocument('Test')
    doc.elements.push(actor('a1'))

    const result = parseDocument(serializeDocument(doc))

    expect(result.ok).toBe(true)
    expect(result.document).toEqual(doc)
  })

  it('dokument bez schemaVersion pada', () => {
    const doc = createEmptyDocument('Test') as unknown as Record<string, unknown>
    delete doc.schemaVersion

    const result = parseDocument(JSON.stringify(doc))

    expect(result.ok).toBe(false)
    expect(result.errors.join(' ')).toContain('schemaVersion')
  })

  it('dokument s nepoznatim tipom elementa pada na shemi', () => {
    const doc = createEmptyDocument('Test') as unknown as {
      elements: unknown[]
    }
    doc.elements.push({
      id: 'e1',
      type: 'uml.bogus',
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
      zIndex: 1,
      style: { fill: '#fff', stroke: '#000', strokeWidth: 1, fontSize: 12 },
      data: {},
    })

    const result = parseDocument(JSON.stringify(doc))

    expect(result.ok).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('veza prema nepostojećem elementId-ju prolazi shemu (strukturno je validna)', () => {
    const doc = createEmptyDocument('Test')
    doc.connections.push(association('c1', 'ne-postoji-1', 'ne-postoji-2'))

    const result = parseDocument(JSON.stringify(doc))

    expect(result.ok).toBe(true)
  })
})

describe('validateReferentialIntegrity', () => {
  it('prazan dokument nema grešaka', () => {
    const doc = createEmptyDocument('Test')

    expect(validateReferentialIntegrity(doc)).toEqual([])
  })

  it('veza prema postojećim elementima ne prijavljuje grešku', () => {
    const doc = createEmptyDocument('Test')
    doc.elements.push(actor('a1'), actor('a2'))
    doc.connections.push(association('c1', 'a1', 'a2'))

    expect(validateReferentialIntegrity(doc)).toEqual([])
  })

  it('detektira vezu koja referencira nepostojeći elementId', () => {
    const doc = createEmptyDocument('Test')
    doc.elements.push(actor('a1'))
    doc.connections.push(association('c1', 'a1', 'ne-postoji'))

    const errors = validateReferentialIntegrity(doc)

    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('c1')
    expect(errors[0]).toContain('ne-postoji')
  })

  it('prijavljuje odvojenu grešku za source i target kad oba ne postoje', () => {
    const doc = createEmptyDocument('Test')
    doc.connections.push(association('c1', 'ne-postoji-1', 'ne-postoji-2'))

    expect(validateReferentialIntegrity(doc)).toHaveLength(2)
  })
})
