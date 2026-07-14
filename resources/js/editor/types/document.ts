/**
 * DiagramDocument — izvor istine.
 * Vue Flow strukture su samo projekcija ovog modela (vidi ADR-0002).
 *
 * VAŽNO: `position` elementa s postavljenim `parentId` je RELATIVNA
 * prema parentu (usklađeno s Vue Flow `parentNode` ponašanjem).
 * Apsolutnu poziciju razrješava geometry sloj (absolutePosition()).
 */

export interface Vec2 {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface ElementStyle {
  fill: string
  stroke: string
  strokeWidth: number
  fontSize: number
  fontFamily?: string
  textAlign?: 'left' | 'center' | 'right'
  opacity?: number
}

interface BaseElement {
  id: string
  /** Diskriminator — vidi DiagramElement union. */
  type: string
  /** Ako postoji, position je relativna prema ovom elementu. */
  parentId?: string
  position: Vec2
  size: Size
  rotation?: number
  zIndex: number
  style: ElementStyle
}

export interface ActorElement extends BaseElement {
  type: 'uml.actor'
  data: { label: string; stereotype?: string }
}

export interface UseCaseElement extends BaseElement {
  type: 'uml.use-case'
  data: { label: string; description?: string }
}

export interface SystemBoundaryElement extends BaseElement {
  type: 'uml.system-boundary'
  data: { label: string }
}

export interface NoteElement extends BaseElement {
  type: 'uml.note'
  data: { text: string }
}

export type DiagramElement =
  | ActorElement
  | UseCaseElement
  | SystemBoundaryElement
  | NoteElement

export type ElementType = DiagramElement['type']

export type ConnectionType =
  | 'uml.association'
  | 'uml.include'
  | 'uml.extend'
  | 'uml.generalization'

export interface ConnectionEndpoint {
  elementId: string
  /** ID anchora iz NodeDefinition.anchors (npr. 'left', 'right'). */
  anchorId: string
}

export type ArrowEnd = 'none' | 'open' | 'triangle-hollow'

export interface ConnectionStyle {
  stroke: string
  strokeWidth: number
  dash?: number[]
  arrowEnd: ArrowEnd
}

export interface ConnectionLabel {
  text: string
  /** 0..1 duž linije. */
  position: number
}

export interface DiagramConnection {
  id: string
  type: ConnectionType
  source: ConnectionEndpoint
  target: ConnectionEndpoint
  routing: { type: 'straight'; points: Vec2[] }
  labels: ConnectionLabel[]
  style: ConnectionStyle
}

export interface CanvasSettings {
  width: number
  height: number
  background: string
  gridSize: number
  snapToGrid: boolean
}

export interface DocumentMetadata {
  title: string
  createdAt: string
  updatedAt: string
}

export interface DiagramDocument {
  schemaVersion: 1
  diagramType: 'uml-use-case'
  metadata: DocumentMetadata
  canvas: CanvasSettings
  elements: DiagramElement[]
  connections: DiagramConnection[]
}

export function createEmptyDocument(title: string): DiagramDocument {
  const now = new Date().toISOString()

  return {
    schemaVersion: 1,
    diagramType: 'uml-use-case',
    metadata: { title, createdAt: now, updatedAt: now },
    canvas: {
      width: 2400,
      height: 1600,
      background: '#ffffff',
      gridSize: 20,
      snapToGrid: true,
    },
    elements: [],
    connections: [],
  }
}
