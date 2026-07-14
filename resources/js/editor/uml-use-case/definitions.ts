/**
 * UML Use Case plugin — jedina lokacija na kojoj su definirane
 * dimenzije, stilovi, anchori i geometrijske konstante elemenata.
 * Vue komponente i SVG exporter čitaju ISTE vrijednosti odavde.
 */
import type {
  DiagramTypeRegistry,
  NodeDefinition,
  EdgeDefinition,
  FontDefinition,
} from '../types/definitions'

export const UML_FONT: FontDefinition = {
  family: 'Inter, system-ui, sans-serif',
  size: 14,
  weight: 400,
  lineHeightFactor: 1.3,
}

export const STANDARD_ANCHORS = [
  { id: 'top', position: { x: 0.5, y: 0 } },
  { id: 'right', position: { x: 1, y: 0.5 } },
  { id: 'bottom', position: { x: 0.5, y: 1 } },
  { id: 'left', position: { x: 0, y: 0.5 } },
]

/**
 * Geometrija actor stick-figure — omjeri unutar bounding boxa.
 * ISTI za Vue komponentu i SVG exporter (zamka 37.11).
 */
export const ACTOR_GEOMETRY = {
  headRadiusRatio: 0.16, // r = ratio * width
  headCenterY: 0.14, // udio visine figure (ne cijelog boxa)
  shoulderY: 0.32,
  armSpanRatio: 0.8, // udio širine
  hipY: 0.62,
  figureHeightRatio: 0.78, // ostatak visine je rezerviran za labelu
} as const

const actor: NodeDefinition = {
  type: 'uml.actor',
  label: 'Actor',
  defaultSize: { width: 70, height: 110 },
  defaultStyle: {
    fill: 'none',
    stroke: '#222222',
    strokeWidth: 2,
    fontSize: UML_FONT.size,
    textAlign: 'center',
  },
  anchors: STANDARD_ANCHORS,
  textPadding: { x: 2, y: 2 },
}

const useCase: NodeDefinition = {
  type: 'uml.use-case',
  label: 'Use Case',
  defaultSize: { width: 170, height: 80 },
  defaultStyle: {
    fill: '#ffffff',
    stroke: '#222222',
    strokeWidth: 2,
    fontSize: UML_FONT.size,
    textAlign: 'center',
  },
  anchors: STANDARD_ANCHORS,
  // Elipsa "jede" kutove — veći padding da tekst ostane unutar oblika.
  textPadding: { x: 24, y: 14 },
}

const systemBoundary: NodeDefinition = {
  type: 'uml.system-boundary',
  label: 'System Boundary',
  defaultSize: { width: 420, height: 320 },
  defaultStyle: {
    fill: '#fafafa',
    stroke: '#222222',
    strokeWidth: 1.5,
    fontSize: UML_FONT.size + 1,
    textAlign: 'center',
  },
  anchors: STANDARD_ANCHORS,
  isContainer: true,
  textPadding: { x: 12, y: 10 },
}

const note: NodeDefinition = {
  type: 'uml.note',
  label: 'Note',
  defaultSize: { width: 170, height: 100 },
  defaultStyle: {
    fill: '#fffbe6',
    stroke: '#b8a94a',
    strokeWidth: 1.5,
    fontSize: UML_FONT.size - 1,
    textAlign: 'left',
  },
  anchors: STANDARD_ANCHORS,
  textPadding: { x: 12, y: 12 },
}

const association: EdgeDefinition = {
  type: 'uml.association',
  label: 'Association',
  defaultStyle: { stroke: '#222222', strokeWidth: 2, arrowEnd: 'none' },
}

const include: EdgeDefinition = {
  type: 'uml.include',
  label: 'Include',
  defaultStyle: {
    stroke: '#222222',
    strokeWidth: 2,
    dash: [6, 4],
    arrowEnd: 'open',
  },
  umlLabel: '<<include>>',
}

const extend: EdgeDefinition = {
  type: 'uml.extend',
  label: 'Extend',
  defaultStyle: {
    stroke: '#222222',
    strokeWidth: 2,
    dash: [6, 4],
    arrowEnd: 'open',
  },
  umlLabel: '<<extend>>',
}

const generalization: EdgeDefinition = {
  type: 'uml.generalization',
  label: 'Generalization',
  defaultStyle: {
    stroke: '#222222',
    strokeWidth: 2,
    arrowEnd: 'triangle-hollow',
  },
}

export const umlUseCaseRegistry: DiagramTypeRegistry = {
  id: 'uml-use-case',
  nodes: {
    'uml.actor': actor,
    'uml.use-case': useCase,
    'uml.system-boundary': systemBoundary,
    'uml.note': note,
  },
  edges: {
    'uml.association': association,
    'uml.include': include,
    'uml.extend': extend,
    'uml.generalization': generalization,
  },
}
