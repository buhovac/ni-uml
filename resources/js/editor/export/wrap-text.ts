/**
 * Deterministički text wrapping — dijele ga editor i SVG exporter.
 *
 * DVA measurera, ISTI interfejs:
 *  - createCanvasMeasurer(): najtačniji, koristi ga editor u browseru;
 *  - approximateMeasurer: deterministički, koristi se u snapshot
 *    testovima i svakom Node okruženju bez canvasa.
 *
 * Razlika između njih je tolerancija koju dopušta revidirani FR63.
 */
import type { FontDefinition } from '../types/definitions'

export type TextMeasurer = (text: string, font: FontDefinition) => number

const NARROW = new Set("iIljtfr.,:;!'|()[] ".split(''))
const WIDE = new Set('mwMWГ@%'.split(''))

/** Aproksimacija širine — dovoljno dobra za wrapping, 100% deterministična. */
export const approximateMeasurer: TextMeasurer = (text, font) => {
  let units = 0

  for (const ch of text) {
    if (ch === ' ') {
units += 0.34
} else if (NARROW.has(ch)) {
units += 0.42
} else if (WIDE.has(ch)) {
units += 0.92
} else if (ch === ch.toUpperCase() && ch !== ch.toLowerCase()) {
units += 0.72
} else {
units += 0.58
}
  }

  return units * font.size
}

/** Browser-only: canvas measureText. Poziv izvan browsera baca grešku. */
export function createCanvasMeasurer(): TextMeasurer {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
throw new Error('Canvas 2D kontekst nije dostupan')
}

  return (text, font) => {
    ctx.font = `${font.weight ?? 400} ${font.size}px ${font.family}`

    return ctx.measureText(text).width
  }
}

/**
 * Word-wrap bez lomljenja riječi (MVP pravilo iz analize).
 * Riječ duža od maxWidth ostaje u vlastitom redu i smije viriti —
 * validator kasnije može upozoriti, exporter ne smije "izmišljati" prijelom.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  font: FontDefinition,
  measure: TextMeasurer = approximateMeasurer,
): string[] {
  const words = text.split(/\s+/).filter(Boolean)

  if (words.length === 0) {
return ['']
}

  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word

    if (!line || measure(candidate, font) <= maxWidth) {
      line = candidate
    } else {
      lines.push(line)
      line = word
    }
  }

  if (line) {
lines.push(line)
}

  return lines
}

export function lineHeight(font: FontDefinition): number {
  return font.size * font.lineHeightFactor
}
