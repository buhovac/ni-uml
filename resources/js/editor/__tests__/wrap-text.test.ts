import { describe, expect, it } from 'vitest'
import {
  approximateMeasurer,
  wrapText,
} from '../export/wrap-text'
import { UML_FONT } from '../uml-use-case/definitions'

describe('wrapText', () => {
  it('je determinističan (isti ulaz → isti izlaz)', () => {
    const a = wrapText('Rezervacija termina za korisnika', 120, UML_FONT)
    const b = wrapText('Rezervacija termina za korisnika', 120, UML_FONT)
    expect(a).toEqual(b)
    expect(a.length).toBeGreaterThan(1)
  })

  it('ne lomi riječ dužu od maxWidth', () => {
    const lines = wrapText('Superkalifragilistična', 40, UML_FONT)
    expect(lines).toEqual(['Superkalifragilistična'])
  })

  it('prazan tekst daje jedan prazan red', () => {
    expect(wrapText('', 100, UML_FONT)).toEqual([''])
  })

  it('svaki red (osim jednoriječnih) stane u maxWidth', () => {
    const maxWidth = 140
    const lines = wrapText(
      'Upravljanje uslugama i pregled dostupnih termina u sustavu',
      maxWidth,
      UML_FONT,
    )

    for (const line of lines) {
      if (line.includes(' ')) {
        expect(approximateMeasurer(line, UML_FONT)).toBeLessThanOrEqual(
          maxWidth,
        )
      }
    }
  })
})
