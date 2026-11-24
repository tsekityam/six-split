/** HKJC Mark Six helpers: 單式 / 複式 / 膽拖, 一注 ($10) / 半注 ($5). */

export const MARK_SIX_MAX = 49
export const MARK_SIX_PICK = 6
export const FULL_UNIT = 10
export const HALF_UNIT = 5

export type UnitType = 'full' | 'half'
export type BetKind = 'single' | 'multiple' | 'banker'

export type MarkSixBet = {
  id: string
  kind: BetKind
  unit: UnitType
  unitPrice: number
  combinations: number
  stake: number
  /** 單式 / 複式 selected numbers */
  numbers: number[]
  /** 膽拖 — 膽碼 */
  bankers: number[]
  /** 膽拖 — 拖碼 */
  drags: number[]
}

export const KIND_LABEL: Record<BetKind, string> = {
  single: '單式',
  multiple: '複式',
  banker: '膽拖',
}

export const UNIT_LABEL: Record<UnitType, string> = {
  full: '一注',
  half: '半注',
}

export function combinations(n: number, k: number): number {
  if (k < 0 || n < 0 || k > n) return 0
  if (k === 0 || k === n) return 1
  const kk = Math.min(k, n - k)
  let result = 1
  for (let i = 1; i <= kk; i += 1) {
    result = (result * (n - kk + i)) / i
  }
  return Math.round(result)
}

function cryptoRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0]! % maxExclusive
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = cryptoRandomInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

function pickUnique(count: number, exclude: Set<number> = new Set()): number[] {
  const pool = Array.from({ length: MARK_SIX_MAX }, (_, i) => i + 1).filter(
    (n) => !exclude.has(n),
  )
  shuffleInPlace(pool)
  return pool.slice(0, count).sort((a, b) => a - b)
}

function unitPrice(unit: UnitType): number {
  return unit === 'full' ? FULL_UNIT : HALF_UNIT
}

type Shape = {
  kind: BetKind
  unit: UnitType
  /** 複式: total numbers; 單式 ignored; 膽拖 unused */
  selectCount?: number
  bankerCount?: number
  dragCount?: number
  combinations: number
  stake: number
}

function enumerateAffordableShapes(remaining: number): Shape[] {
  const shapes: Shape[] = []
  const units: UnitType[] = ['half', 'full']

  for (const unit of units) {
    const price = unitPrice(unit)

    // 單式 — always 1 combination
    if (price <= remaining) {
      shapes.push({
        kind: 'single',
        unit,
        selectCount: MARK_SIX_PICK,
        combinations: 1,
        stake: price,
      })
    }

    // 複式 — pick 7..14 numbers (keep tickets readable)
    for (let n = 7; n <= 14; n += 1) {
      const combos = combinations(n, MARK_SIX_PICK)
      const stake = combos * price
      if (stake <= remaining) {
        shapes.push({
          kind: 'multiple',
          unit,
          selectCount: n,
          combinations: combos,
          stake,
        })
      }
    }

    // 膽拖 — bankers 1..5, drags enough to form lines
    for (let b = 1; b <= 5; b += 1) {
      const needFromDrag = MARK_SIX_PICK - b
      // drag at least needFromDrag; cap for readability
      const maxDrag = Math.min(14, MARK_SIX_MAX - b)
      for (let d = needFromDrag; d <= maxDrag; d += 1) {
        // Skip pure-single equivalent that 膽拖 with d == need and looks odd? Keep all valid.
        const combos = combinations(d, needFromDrag)
        if (combos < 1) continue
        // 膽拖 with exactly 1 combo is valid but identical cost to 單式 — still allowed.
        const stake = combos * price
        if (stake <= remaining) {
          shapes.push({
            kind: 'banker',
            unit,
            bankerCount: b,
            dragCount: d,
            combinations: combos,
            stake,
          })
        }
      }
    }
  }

  return shapes
}

function materialize(shape: Shape): MarkSixBet {
  const price = unitPrice(shape.unit)
  const id = `${shape.kind}-${cryptoRandomInt(1e9)}-${Date.now()}`

  if (shape.kind === 'single') {
    const numbers = pickUnique(MARK_SIX_PICK)
    return {
      id,
      kind: 'single',
      unit: shape.unit,
      unitPrice: price,
      combinations: 1,
      stake: price,
      numbers,
      bankers: [],
      drags: [],
    }
  }

  if (shape.kind === 'multiple') {
    const numbers = pickUnique(shape.selectCount!)
    return {
      id,
      kind: 'multiple',
      unit: shape.unit,
      unitPrice: price,
      combinations: shape.combinations,
      stake: shape.stake,
      numbers,
      bankers: [],
      drags: [],
    }
  }

  // 膽拖
  const bankers = pickUnique(shape.bankerCount!)
  const exclude = new Set(bankers)
  const drags = pickUnique(shape.dragCount!, exclude)
  return {
    id,
    kind: 'banker',
    unit: shape.unit,
    unitPrice: price,
    combinations: shape.combinations,
    stake: shape.stake,
    numbers: [],
    bankers,
    drags,
  }
}

/**
 * Randomly pack bets (any mix of 單式 / 複式 / 膽拖 × 一注 / 半注)
 * so spent stake equals the largest multiple of $5 not exceeding totalAmount.
 */
export function generateBets(totalAmount: number): {
  bets: MarkSixBet[]
  spent: number
  leftover: number
} {
  if (!Number.isFinite(totalAmount) || totalAmount < HALF_UNIT) {
    return { bets: [], spent: 0, leftover: Math.max(0, totalAmount || 0) }
  }

  let remaining = Math.floor(totalAmount / HALF_UNIT) * HALF_UNIT
  const leftover = totalAmount - remaining
  const bets: MarkSixBet[] = []
  let guard = 0
  const maxSteps = 500

  while (remaining >= HALF_UNIT && guard < maxSteps) {
    guard += 1
    const shapes = enumerateAffordableShapes(remaining)
    if (shapes.length === 0) break

    // Sample kind first (equal odds among kinds that have ≥1 affordable shape),
    // then pick a shape of that kind. Avoids 膽拖 flooding the pool by count.
    const kindsPresent = (['single', 'multiple', 'banker'] as BetKind[]).filter(
      (k) => shapes.some((s) => s.kind === k),
    )
    const chosenKind = kindsPresent[cryptoRandomInt(kindsPresent.length)]!
    let pool = shapes.filter((s) => s.kind === chosenKind)

    // Prefer modest tickets so large stakes become a mix, not one mega slip.
    const weights = pool.map((s) => 1 / Math.sqrt(s.combinations))
    const weightSum = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * weightSum
    let picked = pool[0]!
    for (let i = 0; i < pool.length; i += 1) {
      r -= weights[i]!
      if (r <= 0) {
        picked = pool[i]!
        break
      }
    }

    // Near the end, try to spend exactly.
    const exact = shapes.filter((s) => s.stake === remaining)
    if (remaining <= FULL_UNIT * 4 && exact.length > 0 && Math.random() < 0.8) {
      picked = exact[cryptoRandomInt(exact.length)]!
    }

    const bet = materialize(picked)
    bets.push(bet)
    remaining -= bet.stake
  }

  const spent = bets.reduce((sum, b) => sum + b.stake, 0)
  return { bets, spent, leftover: leftover + remaining }
}

/** Traditional Mark Six ball colour bands. */
export function ballTone(n: number): 'red' | 'blue' | 'green' {
  const red = new Set([
    1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46,
  ])
  const blue = new Set([
    3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48,
  ])
  if (red.has(n)) return 'red'
  if (blue.has(n)) return 'blue'
  return 'green'
}
