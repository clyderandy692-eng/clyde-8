/**
 * Garde-fou des largeurs imposées.
 *
 * Deux moitiés, et les deux comptent : d'abord le détecteur est éprouvé sur des
 * sources fabriquées, ensuite il est lâché sur le vrai code. Sans la première
 * moitié, une expression régulière cassée laisserait la seconde au vert pour
 * toujours — un garde-fou qui ne détecte plus rien ne se signale jamais.
 */

import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { USABLE_WIDTH, findFixedWidths } from '../responsive-audit'

describe('détecteur de largeurs imposées', () => {
  it('signale une largeur plus large que l’écran étroit', () => {
    const trouve = findFixedWidths('<div className="w-[900px]" />')
    expect(trouve).toHaveLength(1)
    expect(trouve[0].px).toBe(900)
    expect(trouve[0].line).toBe(1)
  })

  it('signale aussi une largeur minimale imposée', () => {
    expect(findFixedWidths('<div className="min-w-[500px]" />')).toHaveLength(1)
  })

  /* Régression : `max-w-[…]` est un PLAFOND, il autorise l'élément à rétrécir.
     Une première version de l'expression le capturait par sa fin (`w-[…]`) et
     aurait fait rejeter la mise en page centrée la plus banale du projet —
     `mx-auto max-w-[420px]`, présente dans la page d'accueil. */
  it('laisse passer un plafond de largeur', () => {
    expect(findFixedWidths('<div className="mx-auto max-w-[1700px]" />')).toEqual([])
    expect(findFixedWidths('<div className="max-w-[420px]" />')).toEqual([])
  })

  /* Régression : la limite est un seuil, pas une approximation. Une largeur qui
     tient dans l'écran étroit est légitime et doit rester silencieuse, sinon le
     garde-fou crie sur du code correct et on apprend à l'ignorer. */
  it('laisse passer une largeur qui tient dans l’écran étroit', () => {
    expect(findFixedWidths(`<div className="w-[${USABLE_WIDTH}px]" />`)).toEqual([])
    expect(findFixedWidths('<div className="w-[88px]" />')).toEqual([])
  })

  it('rapporte la ligne pour que le défaut soit trouvable', () => {
    const source = ['ligne une', 'ligne deux', '<div className="w-[800px]" />'].join('\n')
    expect(findFixedWidths(source)[0].line).toBe(3)
  })
})

describe('le code du projet tient dans un écran de 390 px', () => {
  /* Le calque de fond est gelé par une règle du projet : il est rapporté,
     jamais corrigé. L'exclure ici évite un échec qu'on n'a pas le droit de
     réparer — un test qu'on ne peut pas faire passer finit désactivé. */
  const FROZEN = ['backdrop.tsx']

  it('n’impose aucune largeur plus large que l’écran', () => {
    const files = globSync('{components,app}/**/*.tsx').filter(
      (file) => !FROZEN.some((frozen) => file.endsWith(frozen)),
    )

    /* On rassemble TOUS les défauts avant d'échouer : s'arrêter au premier
       obligerait à relancer la suite autant de fois qu'il y a de fautes. */
    const defauts = files.flatMap((file) =>
      findFixedWidths(readFileSync(file, 'utf8')).map(
        (found) => `${file}:${found.line} — ${found.className}`,
      ),
    )

    expect(files.length).toBeGreaterThan(20)
    expect(defauts).toEqual([])
  })
})
