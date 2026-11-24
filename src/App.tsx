import { useState, type FormEvent } from 'react'
import {
  AssistChip,
  ElevatedCard,
  FilledButton,
  Icon,
  OutlinedCard,
  OutlinedTextField,
  SuggestionChip,
  TextButton,
} from './material/md-components'
import {
  HALF_UNIT,
  KIND_LABEL,
  UNIT_LABEL,
  ballTone,
  generateBets,
  type BetKind,
  type MarkSixBet,
} from './lib/markSix'

type ResultState = {
  bets: MarkSixBet[]
  spent: number
  leftover: number
  requested: number
}

function formatHkd(amount: number): string {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: 'HKD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function NumberBall({
  n,
  variant = 'normal',
}: {
  n: number
  variant?: 'normal' | 'banker' | 'drag'
}) {
  const tone = ballTone(n)
  const className = [
    'number-ball',
    tone,
    variant === 'banker' ? 'banker' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      className={className}
      aria-label={
        variant === 'banker'
          ? `膽 ${n}`
          : variant === 'drag'
            ? `拖 ${n}`
            : `Number ${n}`
      }
    >
      {String(n).padStart(2, '0')}
    </span>
  )
}

function BetCard({ bet, index }: { bet: MarkSixBet; index: number }) {
  return (
    <OutlinedCard className="bet-card">
      <div className="bet-card-header">
        <div className="bet-meta">
          <span className="md-typescale-label-medium muted">
            #{String(index + 1).padStart(2, '0')}
          </span>
          <AssistChip label={KIND_LABEL[bet.kind]} />
          <SuggestionChip label={UNIT_LABEL[bet.unit]} />
          <span className="md-typescale-body-small muted">
            {bet.combinations} 注組合
          </span>
        </div>
        <span className="md-typescale-title-medium stake">
          {formatHkd(bet.stake)}
        </span>
      </div>

      {bet.kind === 'banker' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p
              className="md-typescale-label-medium"
              style={{ margin: '0 0 8px', color: 'var(--md-sys-color-primary)' }}
            >
              膽碼
            </p>
            <div className="ball-row">
              {bet.bankers.map((n) => (
                <NumberBall key={`${bet.id}-b-${n}`} n={n} variant="banker" />
              ))}
            </div>
          </div>
          <div>
            <p className="md-typescale-label-medium muted" style={{ margin: '0 0 8px' }}>
              拖碼
            </p>
            <div className="ball-row">
              {bet.drags.map((n) => (
                <NumberBall key={`${bet.id}-d-${n}`} n={n} variant="drag" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="ball-row">
          {bet.numbers.map((n) => (
            <NumberBall key={`${bet.id}-${n}`} n={n} />
          ))}
        </div>
      )}
    </OutlinedCard>
  )
}

export default function App() {
  const [amountInput, setAmountInput] = useState('100')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResultState | null>(null)
  const [busy, setBusy] = useState(false)

  function runGenerate(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) {
      setError('請輸入總投注金額。')
      setResult(null)
      return
    }

    const amount = Number(trimmed)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('金額必須為正數。')
      setResult(null)
      return
    }
    if (!Number.isInteger(amount)) {
      setError('請使用整數金額（不用小數）。')
      setResult(null)
      return
    }
    if (amount < HALF_UNIT) {
      setError(
        `最低投注為 ${formatHkd(HALF_UNIT)}（半注複式／膽拖）；單式最低 ${formatHkd(10)}。`,
      )
      setResult(null)
      return
    }

    setBusy(true)
    setError(null)

    window.setTimeout(() => {
      const generated = generateBets(amount)
      setResult({
        ...generated,
        requested: amount,
      })
      setBusy(false)
    }, 40)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    runGenerate(amountInput)
  }

  const summary =
    result == null
      ? null
      : result.bets.reduce(
          (acc, b) => {
            acc[b.kind] += 1
            return acc
          },
          { single: 0, multiple: 0, banker: 0 } as Record<BetKind, number>,
        )

  const helperText =
    error ??
    `單式僅一注 ${formatHkd(10)}；複式／膽拖可一注或半注 ${formatHkd(HALF_UNIT)}。非 $5 倍數餘額不投注。`

  return (
    <div>
      <header className="app-bar">
        <Icon>casino</Icon>
        <h1 className="md-typescale-title-large" style={{ margin: 0 }}>
          Mark Six · 六合彩
        </h1>
      </header>

      <main className="app-shell">
        <h2 className="md-typescale-headline-medium" style={{ margin: '0 0 8px' }}>
          Bet Slip Generator
        </h2>
        <p className="md-typescale-body-large muted" style={{ margin: '0 0 24px' }}>
          輸入總投注額，隨機產生單式（一注）、複式／膽拖（一注或半注），合計金額與輸入一致。
        </p>

        <ElevatedCard>
          <form className="form-stack" onSubmit={onSubmit} noValidate>
            <OutlinedTextField
              label="總投注金額（港元）"
              type="number"
              value={amountInput}
              error={Boolean(error)}
              errorText={error ?? ''}
              supportingText={error ? '' : helperText}
              min={String(HALF_UNIT)}
              step={String(HALF_UNIT)}
              onInput={(e: Event) => {
                const t = e.target as HTMLInputElement
                setAmountInput(t.value)
              }}
            />
            <FilledButton type="submit" disabled={busy}>
              <Icon slot="icon">casino</Icon>
              {busy ? '產生中…' : '隨機產生'}
            </FilledButton>
          </form>
        </ElevatedCard>

        {result ? (
          <section aria-live="polite" style={{ marginTop: 24 }}>
            <div className="section-header">
              <div>
                <h3 className="md-typescale-title-large" style={{ margin: 0 }}>
                  注項清單
                </h3>
                <p className="md-typescale-body-medium muted" style={{ margin: '4px 0 0' }}>
                  共 {result.bets.length} 項 · 已投 {formatHkd(result.spent)}
                  {result.leftover > 0
                    ? ` · 餘額 ${formatHkd(result.leftover)}`
                    : ` · 與輸入 ${formatHkd(result.requested)} 相符`}
                </p>
                {summary ? (
                  <p className="md-typescale-body-small muted" style={{ margin: '4px 0 0' }}>
                    單式 {summary.single} · 複式 {summary.multiple} · 膽拖{' '}
                    {summary.banker}
                  </p>
                ) : null}
              </div>
              <TextButton
                disabled={busy}
                onClick={() => runGenerate(String(result.requested))}
              >
                <Icon slot="icon">refresh</Icon>
                再抽一次
              </TextButton>
            </div>

            {result.bets.length === 0 ? (
              <p className="md-typescale-body-medium muted">
                未能產生注項，請試試更大金額。
              </p>
            ) : (
              <ol className="bet-list">
                {result.bets.map((bet, index) => (
                  <li key={bet.id}>
                    <BetCard bet={bet} index={index} />
                  </li>
                ))}
              </ol>
            )}
          </section>
        ) : null}

        <p className="md-typescale-body-small footer-note">
          僅供娛樂，與香港馬會無關。號碼為瀏覽器端隨機產生，並非正式投注單。使用 Google
          Material Web（@material/web）官方元件。
        </p>
      </main>
    </div>
  )
}
