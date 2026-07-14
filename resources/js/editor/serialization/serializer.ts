/**
 * Serializer/Migrator — roundtrip mora biti stabilan:
 * parse(serialize(doc)) daje semantički identičan dokument (Faza 0, pitanje 2).
 */
import type { DiagramDocument } from '../types/document'

export function serializeDocument(doc: DiagramDocument): string {
  return JSON.stringify(doc, null, 2)
}

export interface ParseResult {
  ok: boolean
  document?: DiagramDocument
  errors: string[]
}

/**
 * U aplikaciji se prije parsiranja poziva Ajv validacija prema
 * schemas/diagram-document.v1.schema.json (i na frontendu i na backendu).
 * Ovdje je minimalna strukturna provjera + mjesto za migracije.
 */
export function parseDocument(json: string): ParseResult {
  let raw: unknown

  try {
    raw = JSON.parse(json)
  } catch (e) {
    return { ok: false, errors: [`Neispravan JSON: ${(e as Error).message}`] }
  }

  const doc = raw as Partial<DiagramDocument>
  const errors: string[] = []

  if (doc.schemaVersion === undefined) {
errors.push('Nedostaje schemaVersion')
}

  if (doc.diagramType !== 'uml-use-case') {
errors.push(`Nepodržan diagramType: ${String(doc.diagramType)}`)
}

  if (!Array.isArray(doc.elements)) {
errors.push('elements mora biti niz')
}

  if (!Array.isArray(doc.connections)) {
errors.push('connections mora biti niz')
}

  if (errors.length > 0) {
return { ok: false, errors }
}

  const migrated = migrate(doc as DiagramDocument)

  return { ok: true, document: migrated, errors: [] }
}

/** Lanac migracija v1 → v2 → ... (za sada identitet). */
function migrate(doc: DiagramDocument): DiagramDocument {
  switch (doc.schemaVersion) {
    case 1:
      return doc
    default:
      throw new Error(
        `Nepoznata schemaVersion ${String(doc.schemaVersion)} — potrebna novija verzija aplikacije`,
      )
  }
}
