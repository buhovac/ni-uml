/**
 * BR04: veza mora referencirati postojeći source/target element. Ovo je
 * strukturno validno po JSON shemi (elementId je samo string), pa se
 * provjerava odvojeno kao domenska provjera.
 *
 * Namjerno NIJE dio punog UML validation engine-a (Etapa 10) — samo
 * referencijalna provjera veza→elementi.
 */
import type { DiagramDocument } from '../types/document'

export function validateReferentialIntegrity(doc: DiagramDocument): string[] {
  const elementIds = new Set(doc.elements.map((e) => e.id))
  const errors: string[] = []

  for (const conn of doc.connections) {
    if (!elementIds.has(conn.source.elementId)) {
      errors.push(
        `Veza ${conn.id}: izvorni element ${conn.source.elementId} ne postoji`,
      )
    }

    if (!elementIds.has(conn.target.elementId)) {
      errors.push(
        `Veza ${conn.id}: ciljni element ${conn.target.elementId} ne postoji`,
      )
    }
  }

  return errors
}
