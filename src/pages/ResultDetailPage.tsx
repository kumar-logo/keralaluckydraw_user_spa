import { useState, useEffect, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Input, ScrollShadow } from '@nextui-org/react'
import { formatDate } from '../utils/date'
import { TopBar } from '../components/shared/TopBar'
import { DigitBadge } from '../components/shared/DigitBadge'
import { ColorBall } from '../components/four_five_digit/ColorBall'
import { PositionConfigProvider } from '../config/positionConfig'
import { useDigitPositionConfigStore, gameIdFromDrawNo } from '../stores/digitPositionConfigStore'
import { NoData } from '../components/shared/NoData'

interface PrizeTier {
  level?: number
  prize?: number | string
  codes: string[]
}

interface BetMatch {
  code: string
  prize: number
  status: number
}

interface ResultPrize {
  level?: number
  prize?: number | string
  amount?: number | string
  codes?: string[]
  code?: string | number
}

interface ResultDetail {
  prizes?: ResultPrize[]
  result1st?: string
  result?: string
  maxPrize?: number | string
  roundNo?: string | number
  roundId?: string | number
  issueNo?: string | number
  drawNo?: string | number
  drawTime?: string | number
  drawSec?: string | number
  gameName?: string
  gameType?: string
}

const tierLevelIcon = (level?: number) => `lottery-top-icon-${level || 1}`

const DigitRow = ({
  code,
  leadOutline,
  digitMode = false,
}: {
  code: string
  leadOutline: boolean
  digitMode?: boolean
}) => {
  if (digitMode) {
    return (
      <div className="flex items-center gap-x-0.5 *:mr-0.5">
        {code.split('').map((digit, idx) => (
          <ColorBall key={idx} index={idx} digit={digit} ballSize="1.75rem" fontSize="0.875rem" />
        ))}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-x-0.5">
      {code.split('').map((digit, idx) => (
        <DigitBadge
          key={idx}
          digit={digit}
          outline={!isNaN(Number(digit)) || (leadOutline ? idx !== 0 : true)}
          className="size-7 rounded-sm text-sm font-bold"
        />
      ))}
    </div>
  )
}

export const ResultDetailPage = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [result, setResult] = useState<ResultDetail>({})
  const [keyword, setKeyword] = useState('')
  const [matches, setMatches] = useState<BetMatch[]>([])
  const fetchPositionConfigs = useDigitPositionConfigStore((s) => s.fetchConfigs)
  const configs = useDigitPositionConfigStore((s) => s.configs)

  const digitMode = location.pathname.includes('/result/digit/') || location.pathname.includes('/result/5d/')

  useEffect(() => {
    if (digitMode) fetchPositionConfigs()
  }, [digitMode, fetchPositionConfigs])

  useEffect(() => {
    const stateResult = (location.state as { result?: ResultDetail } | null)?.result
    if (stateResult && Object.keys(stateResult).length > 0) {
      setResult(stateResult)
      return
    }
    const wantRound = searchParams.get('roundNo')
    try {
      const parsed = JSON.parse(localStorage.getItem('ResultDetails') || '{}') as ResultDetail
      if (parsed && Object.keys(parsed).length > 0) {
        if (!wantRound || String(parsed.roundNo) === wantRound) {
          setResult(parsed)
          return
        }
      }
    } catch (err) {
      console.debug('ResultDetailPage: failed to parse stored ResultDetails', err)
    }
    setResult({})
  }, [location.state, searchParams])

  const gameName = result.gameName || searchParams.get('gameName') || result.gameType || 'Game'

  const positionEntry = useMemo(() => {
    if (!digitMode) return { colors: [], labels: [] }
    const drawNo = String(result.drawNo || result.roundNo || searchParams.get('id') || '')
    return configs[gameIdFromDrawNo(drawNo)] ?? { colors: [], labels: [] }
  }, [digitMode, result, searchParams, configs])

  const tiers: PrizeTier[] = useMemo(() => {
    if (Array.isArray(result.prizes) && result.prizes.length > 0) {
      return result.prizes.map((prize) => ({
        level: prize.level,
        prize: prize.prize ?? prize.amount,
        codes: prize.codes || (prize.code ? [String(prize.code)] : []),
      }))
    }
    const single = result.result1st || result.result
    if (single) {
      return [{ level: 1, prize: result.maxPrize, codes: [String(single).split(',').join('')] }]
    }
    return []
  }, [result])

  const searched = keyword.trim().length > 0

  const onSearch = (value: string) => {
    setKeyword(value)
    if (!value || value.trim() === '') {
      setMatches([])
      return
    }
    if (!tiers || tiers.length === 0) {
      setMatches([{ code: value, prize: 0, status: 0 }])
      return
    }
    const hit = tiers.find((tier) => tier.codes.find((code) => value.indexOf(code) !== -1))
    if (!hit) {
      setMatches([{ code: value, prize: 0, status: 0 }])
      return
    }
    setMatches([{ code: value, prize: Number(hit.prize) || 0, status: 1 }])
  }

  const wonText = useMemo(() => {
    if (matches.length) {
      const total = matches.reduce((sum, match) => sum + (match.prize || 0), 0)
      return total ? `${total}` : ''
    }
    return ''
  }, [matches])

  return (
    <div className="size-full flex flex-col overflow-hidden">
      <TopBar title={gameName} />

      <div className="p-3 flex flex-col sticky z-1 top-0 bg-light-gray">
        <Input
          classNames={{
            base: 'border border-gray bg-light-gray rounded-sm flex-1 h-11',
            input: 'pl-3 pr-0 text-sm text-sec font-bold text-left h-full placeholder:text-sec-acc placeholder:font-medium flex-1',
            inputWrapper: 'h-full px-3 py-0',
            innerWrapper: 'pb-0',
          }}
          placeholder={t('result.kerala.placeholder')}
          value={keyword}
          onValueChange={onSearch}
          isClearable
          onClear={() => onSearch('')}
        />
      </div>

      <ScrollShadow className="flex flex-col p-2 flex-1 overflow-y-auto *:mb-2 *:last:mb-0">
        <PositionConfigProvider colors={positionEntry.colors} labels={positionEntry.labels}>
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-acc">{result.roundNo || result.roundId || result.issueNo || '--'}</span>
          <span className="text-xs text-acc">
            {(result.drawTime || result.drawSec) ? formatDate(result.drawTime || result.drawSec) : '--'}
          </span>
        </div>

        {!searched && tiers.length > 0 && tiers.map((tier, idx) => (
          <div key={idx} className="flex p-2 bg-selected justify-between">
            <div>
              <div className={`${tierLevelIcon(tier.level)} mb-1`} />
              <p className="text-xs font-bold text-acc capitalize">total prizes</p>
              <p className="text-sm font-bold text-main">RS{tier.prize ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-right text-acc font-bold">Result</p>
              <div className="flex flex-col gap-y-2 mt-1">
                {tier.codes.map((code, ci) => (
                  <DigitRow key={ci} code={code} leadOutline={true} digitMode={digitMode} />
                ))}
              </div>
            </div>
          </div>
        ))}

        {!searched && tiers.length === 0 && (
          <div className="h-72">
            <NoData />
          </div>
        )}

        {searched && matches.length > 0 && (
          <div className="rounded overflow-hidden flex-none bg-selected flex p-2 flex-col">
            {wonText ? (
              <div className="flex flex-col items-center justify-center">
                <span className="text-bg-sec font-bold text-sm">{t('common.tip.info.orderWin')}</span>
                <span className="text-acc text-xs mt-2">{t('result.havewon')}</span>
                <span className="text-main text-base mt-1 font-bold">{wonText}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <span className="text-sec font-bold text-sm">{t('result.sorry')}</span>
                <span className="text-acc text-xs mt-2">{t('result.better')}</span>
              </div>
            )}
            <div className="text-xs text-acc">
              <div className="flex flex-col">
                {matches.map((match, idx) => (
                  <div key={idx} className="flex flex-col items-center rounded gap-y-2 p-3">
                    <div className="px-2 py-1 border border-gray rounded-sm flex">
                      <p className="font-bold text-xs text-sec">No.{result.roundNo || result.roundId || ''}</p>
                    </div>
                    <span>{t('result.yourbets')}</span>
                    <DigitRow code={match.code} leadOutline={true} digitMode={digitMode} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {searched && matches.length === 0 && (
          <div className="h-72">
            <NoData />
          </div>
        )}
        </PositionConfigProvider>
      </ScrollShadow>
    </div>
  )
}

export default ResultDetailPage
