/**
 * Serializer/Migrator — roundtrip mora biti stabilan:
 * parse(serialize(doc)) daje semantički identičan dokument (Faza 0, pitanje 2).
 */
import Ajv from 'ajv'
import type { ErrorObject } from 'ajv'
import diagramDocumentSchema from '../../../../schemas/diagram-document.v1.schema.json'
import type { DiagramDocument } from '../types/document'

/**
 * Ajv instanca se pravi jednom na razini modula (compile je skup) — ne po
 * pozivu parseDocument. `strict: false` jer shema koristi `format: "date-time"`
 * bez ajv-formats paketa (vidi sažetak sesije koja je uvela ovu validaciju);
 * format se time ne provjerava strogo, samo se ignorira ako je nepoznat.
 */
const ajv = new Ajv({ allErrors: true, strict: false })
const validateSchema = ajv.compile(diagramDocumentSchema)

export function serializeDocument(doc: DiagramDocument): string {
  return JSON.stringify(doc, null, 2)
}

export interface ParseResult {
  ok: boolean
  document?: DiagramDocument
  errors: string[]
}

/**
 * Validira sirovi JSON prema schemas/diagram-document.v1.schema.json (Ajv),
 * pa tek onda pušta dokument kroz migracijski lanac. Referencijalni integritet
 * veza (BR04) NIJE dio JSON sheme (strukturno je validan i s nepostojećim
 * elementId-jem) — za to postoji zasebna provjera, validateReferentialIntegrity.
 */
export function parseDocument(json: string): ParseResult {
  let raw: unknown

  try {
    raw = JSON.parse(json)
  } catch (e) {
    return { ok: false, errors: [`Neispravan JSON: ${(e as Error).message}`] }
  }

  if (!validateSchema(raw)) {
    return { ok: false, errors: formatAjvErrors(validateSchema.errors) }
  }

  const migrated = migrate(raw as unknown as DiagramDocument)

  return { ok: true, document: migrated, errors: [] }
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors || errors.length === 0) {
    return ['Dokument ne odgovara shemi diagram-document.v1']
  }

  return errors.map((e) => `${e.instancePath || '/'} ${e.message ?? 'nevažeća vrijednost'}`)
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
