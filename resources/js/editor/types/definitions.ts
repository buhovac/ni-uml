/**
 * Deklarativne definicije koje DIJELE editor (Vue Flow komponente)
 * i SVG export renderer. Nijedan renderer ne smije sam odlučivati
 * o dimenzijama, bojama ili anchorima (vidi ADR-0003).
 */
import type {
  ConnectionStyle,
  ConnectionType,
  ElementStyle,
  ElementType,
  Size,
  Vec2,
} from './document'

export interface AnchorDefinition {
  id: string
  /** Relativno 0..1 unutar bounding boxa elementa. */
  position: Vec2
}

export interface FontDefinition {
  family: string
  size: number
  weight?: number
  /** Množitelj fontSize → visina reda (deterministički, ne CSS default). */
  lineHeightFactor: number
}

export interface NodeDefinition {
  type: ElementType
  label: string
  defaultSize: Size
  defaultStyle: ElementStyle
  anchors: AnchorDefinition[]
  isContainer?: boolean
  /** Padding za text wrapping — koristi ga i editor i exporter. */
  textPadding: { x: number; y: number }
}

export interface EdgeDefinition {
  type: ConnectionType
  label: string
  defaultStyle: ConnectionStyle
  /** Automatska UML labela (npr. '<<include>>'), ako postoji. */
  umlLabel?: string
}

export interface DiagramTypeRegistry {
  id: string
  nodes: Record<string, NodeDefinition>
  edges: Record<string, EdgeDefinition>
}
