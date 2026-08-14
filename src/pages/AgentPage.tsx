import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, ScrollShadow, Image } from '@nextui-org/react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import clsx from 'clsx'
import { getAgentPanel, getAgentRule } from '../services/financeApi'
import { formatCurrency } from '../utils/format'
import { checkAuth, withLoading } from '../utils/helpers'
import { Spin } from '../components/shared/Spin'
import { AgentSumReport, useAgentSumReport } from '../components/agent/AgentSumReport'
import { NavBarSpacer } from '../components/shared/NavBarSpacer'
import { ShareModal } from '../components/shared/ShareModal'
import { useUIStore } from '../stores/uiStore'
import { useAppConfigStore } from '../stores/configStore'

interface AgentPanel {
  amountLast: number
  accountLast: number
  amountTotal: number
  amountCurrent: number
  accountTotal: number
  accountCurrent: number
  rcgAmountTotal: number
  rcgAmountCurrent: number
  betAmountTotal: number
  betAmountCurrent: number
  level: number
  inviteCode: string
}

interface AgentRuleRow {
  tier: number | string
  amount: number
  bonus: number
  rate: number | string
}

interface AgentRules {
  gameConfigs: Record<string, AgentRuleRow[]>
  rcgConfigs: AgentRuleRow[]
}

const AGENT_SPRITE_IMAGE = '/images/agent/agent-sprite-v2.webp'
const AGENT_SPRITE_SIZE = [21.5, 60.125]
const AGENT_SPRITE_POS_MAP: Record<string, [number, number]> = {
  banner: [0, 0],
  v1: [0, 7.75], v2: [4.125, 7.75], v3: [8.25, 7.75], v4: [12.375, 7.75], v5: [16.5, 7.75],
  v6: [0, 11.875], v7: [4.125, 11.875], v8: [8.25, 11.875], v9: [12.375, 11.875], v10: [16.5, 11.875],
  subEntry: [0, 16], searchEntry: [10.875, 16],
  ruleDark: [0, 21.25], ruleLight: [0, 41.375],
  subLogo: [0, 40],
}
const AgentSprite = ({ pos, className, scale: s = 1 }: { pos: string; className?: string; scale?: number }) => {
  const coords = AGENT_SPRITE_POS_MAP[pos]
  if (!coords) return null
  return (
    <div
      className={clsx('bg-no-repeat shrink-0', className)}
      style={{
        backgroundImage: `url(${AGENT_SPRITE_IMAGE})`,
        backgroundSize: `${AGENT_SPRITE_SIZE[0] * s}rem ${AGENT_SPRITE_SIZE[1] * s}rem`,
        backgroundPosition: `-${coords[0] * s}rem -${coords[1] * s}rem`,
      }}
    />
  )
}

const levelCommMap: Record<number, string> = {
  1: formatCurrency(100, 0), 2: formatCurrency(1000, 0), 3: formatCurrency(5000, 0), 4: formatCurrency(50000, 0), 5: formatCurrency(100000, 0),
  6: formatCurrency(150000, 0), 7: formatCurrency(400000, 0), 8: formatCurrency(1000000, 0), 9: formatCurrency(1500000, 0), 10: formatCurrency(2500000, 0),
}
const vipPosMap: Record<number, string> = { 1: 'v1', 2: 'v2', 3: 'v3', 4: 'v4', 5: 'v5', 6: 'v6', 7: 'v7', 8: 'v8', 9: 'v9', 10: 'v10' }

const UpArrowIcon = () => (
  <svg style={{ width: '0.5rem', height: '0.5rem' }} viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 0.666992L6.59808 4.52414H1.40192L4 0.666992Z" fill="#00C58A" />
    <rect x={2.92969} y={4.09473} width={2.14286} height={4.28571} fill="#00C58A" />
  </svg>
)

const VipLevelBadge = ({ level, className, scale = 1 }: { level: number; className?: string; scale?: number }) => (
  <div className={clsx('relative', className)}>
    <AgentSprite pos={vipPosMap[level] ?? 'v1'} className="size-full" scale={scale} />
    <div
      className="absolute left-0 bottom-0 text-center w-full din font-black"
      style={{ fontSize: 0.75 * scale + 'rem' }}
    >Lv{level}</div>
  </div>
)

const DiamondIcon = ({ className = 'size-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9.14258" y="9.64453" width="6.85714" height="6.85714" rx="1.14286" fill="#B90D01" />
    <g filter="url(#filter0_b_6209_24679)">
      <rect y="3.35742" width="11.4286" height="11.4286" rx="2.28571" fill="#176BE3" fillOpacity="0.6" />
    </g>
    <rect x="12" y="0.5" width="3.42857" height="3.42857" rx="1.14286" fill="#F2BF31" />
    <defs>
      <filter id="filter0_b_6209_24679" x="-9.14286" y="-5.78544" width="29.7134" height="29.7134" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feGaussianBlur in="BackgroundImageFix" stdDeviation="4.57143" />
        <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_6209_24679" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_backgroundBlur_6209_24679" result="shape" />
      </filter>
    </defs>
  </svg>
)

const BulletIcon = () => (
  <svg className="size-2.5 mt-0.5" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.82443 0.854102C4.5254 0.344814 5.4746 0.344814 6.17557 0.854102L8.57971 2.60081C9.28069 3.1101 9.574 4.01284 9.30625 4.83688L8.38795 7.66312C8.12021 8.48716 7.35229 9.04508 6.48584 9.04508H3.51416C2.64771 9.04508 1.87979 8.48716 1.61205 7.66312L0.693745 4.83688C0.425997 4.01284 0.719313 3.1101 1.42029 2.60081L3.82443 0.854102Z" fill="#176BE3" />
  </svg>
)

const AgentPanelCard = ({ panel }: { panel: AgentPanel }) => {
  const { t } = useTranslation()
  const [shareOpen, setShareOpen] = useState(false)

  return (
    <div className="rounded-lg p-3 text-main bg-linear-to-b from-white/80 to-white dark:from-gray/60 dark:to-gray relative backdrop-blur-md">

      <div className="brand-info-panel p-2 rounded-lg dark:text-gray flex mb-3 items-center">
        <div className="flex-1 mr-2">
          <p className="text-xs font-bold capitalize mb-2">{t('referral.docs.title')}</p>
          <p className="capitalize text-main/60 dark:text-gray/80 text-10 mb-1">{t('referral.label.upgradeConditions')}</p>
          {levelCommMap[panel.level] && (
            <p className="capitalize text-xs">
              {t('common.label.total')}{' '}
              <span className="text-tip font-bold">{levelCommMap[panel.level]}</span>
              {' '}{t('referral.label.commission')}
            </p>
          )}
        </div>
        <VipLevelBadge className="size-16" level={panel.level} />
      </div>

      <div className="flex justify-between pb-3 border-b border-gray">
        <div>
          <p className="text-2xl font-bold">{formatCurrency(panel.amountLast, 0)}</p>
          <p className="text-acc text-xs inter">{t('referral.label.yesterdayComm')}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{panel.accountLast || 0}</p>
          <p className="text-acc text-xs inter">{t('referral.label.yesterdaySubo')}</p>
        </div>
      </div>

      <div className="my-3">
        <div className="flex">
          <div className="flex-1">
            <div className="flex items-center">
              <span className="text-lg font-bold ml-2 mr-1">{formatCurrency(panel.amountTotal, 0)}</span>
              <UpArrowIcon />
              <span className="text-10 ml-0.5 text-[#00C58A] font-bold">{formatCurrency(panel.amountCurrent, 0)}</span>
            </div>
            <p className="text-xs text-acc inter">{t('referral.label.totalComm')}</p>
          </div>
          <div className="flex-1">
            <div className="flex items-center">
              <span className="text-lg font-bold ml-2 mr-1">{panel.accountTotal}</span>
              <span className="text-10 ml-0.5 text-[#00C58A] font-bold">+{panel.accountCurrent}</span>
            </div>
            <p className="text-xs text-acc inter">{t('referral.label.team')}</p>
          </div>
        </div>
        <div className="flex mt-3">
          <div className="flex-1">
            <div className="flex items-center">
              <span className="text-lg font-bold ml-2 mr-1">{formatCurrency(panel.rcgAmountTotal, 0)}</span>
              <UpArrowIcon />
              <span className="text-10 ml-0.5 text-[#00C58A] font-bold">{formatCurrency(panel.rcgAmountCurrent, 0)}</span>
            </div>
            <p className="text-xs text-acc inter">{t('referral.label.totalFirstRecharge')}</p>
          </div>
          <div className="flex-1">
            <div className="flex items-center">
              <span className="text-lg font-bold ml-2 mr-1">{formatCurrency(panel.betAmountTotal, 0)}</span>
              <UpArrowIcon />
              <span className="text-10 ml-0.5 text-[#00C58A] font-bold">{formatCurrency(panel.betAmountCurrent, 0)}</span>
            </div>
            <p className="text-xs text-acc inter">{t('referral.label.totalBets')}</p>
          </div>
        </div>
      </div>

      <div className="rounded h-9 flex justify-center items-center bg-primary/15">
        <span className="mr-2 text-xs inter">{t('referral.label.pendingComm')}:</span>
        <span className="font-bold">{formatCurrency(panel.amountCurrent, 0)}</span>
      </div>

      <p className="text-10 text-acc text-center mt-2">
        {t('referral.label.settlementtime')}: <span className="text-[#EA1200]">{t('referral.label.every12AM')}</span>
      </p>

      <div className="flex justify-center items-center w-full mt-2">
        <Button
          className="w-full text-[#744b0b] font-bold text-shadow-[0_1px_0_#ffffce99] border-2 border-[#9E1203] h-13 rounded-full text-base uppercase animate-scale-light"
          style={{
            backgroundImage: 'linear-gradient(180deg, #FFFEE2 0%, #FFEB72 42.31%, #C58420 78.85%, #FFFA73 100%)',
            '--light-start': '-4rem',
            '--light-end': '22.75rem',
            '--light-height': '6rem',
          } as React.CSSProperties}
          onPress={() => {
            if (!checkAuth()) return
            setShareOpen(true)
          }}
        >
          {t('common.label.share')}
        </Button>
      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={window.location.origin + '/register?invite=' + (panel.inviteCode || '')}
        code={panel.inviteCode}
      />
    </div>
  )
}

const EntryCards = () => {
  const navigate = useNavigate()
  return (
    <div className="flex items-center h-20 mt-2">
      <Button
        className="flex-1 p-0 h-full rounded-lg shrink-0 relative"
        onPress={() => { if (checkAuth()) navigate('/agent/subordinates') }}
      >
        <AgentSprite className="size-full" pos="subEntry" />
      </Button>
      <div className="w-2" />
      <Button className="flex-1 p-0 h-full rounded-lg shrink-0 relative">
        <AgentSprite className="size-full" pos="searchEntry" />
      </Button>
    </div>
  )
}

const AgentRulesSection = ({ rules }: { rules: AgentRules }) => {
  const { t } = useTranslation()
  const isDarkMode = document.documentElement.classList.contains('dark')

  return (
    <div className="my-2 p-3 bg-white dark:bg-charcoal rounded">

      <div className="bg-light-gray dark:bg-gray rounded p-3 mb-5">
        <div className="text-main font-bold flex items-center justify-center">
          <DiamondIcon />
          <p className="mx-5">{t('referral.label.agentLevelOverview')}</p>
          <DiamondIcon />
        </div>
        <p className="capitalize text-xs text-sec my-2">{t('referral.docs.agentLevelOverview')}</p>
        <div className="rounded-t bg-table-header p-2 flex items-center text-xs text-center">
          <div className="w-16">{t('referral.label.level')}</div>
          <div className="flex-1">{t('referral.label.nextLevelUpgradeCommission')}</div>
        </div>
        <div className="text-center text-main text-xs">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lvl => (
            <div key={lvl} className="p-2 flex items-center odd:bg-table-odd even:bg-table-even">
              <div className="w-16 flex justify-center text-sec">
                <VipLevelBadge className="size-8" level={lvl} scale={0.5} />
              </div>
              <div className="flex-1">{levelCommMap[lvl]}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-main font-bold">{t('referral.label.agentRule')}</p>
      <div className="brand-rule-wash my-3 py-5 rounded-lg bg-white dark:bg-gray">
        <p className="px-5 text-sec text-sm leading-4.5 mb-3 capitalize">{t('referral.docs.agentRule')}</p>
        <AgentSprite pos={isDarkMode ? 'ruleDark' : 'ruleLight'} className="w-full h-75" />
      </div>

      <div className="capitalize text-xs leading-4">
        <div className="flex">
          <BulletIcon />
          <div className="flex-1 ml-1">{t('referral.docs.agentRuleDoc1')}</div>
        </div>
        <div className="my-3 flex">
          <BulletIcon />
          <div className="flex-1 ml-1">{t('referral.docs.agentRuleDoc2')}</div>
        </div>
        <div className="flex">
          <BulletIcon />
          <div className="flex-1 ml-1">{t('referral.docs.agentRuleDoc3')}</div>
        </div>
      </div>

      {rules?.gameConfigs && Object.keys(rules.gameConfigs).map((key: string) => (
        <div key={key} className="mt-3">
          <table className="w-full text-xs text-center">
            <thead>
              <tr className="bg-table-header h-8">
                <th className="font-medium">{t('common.label.tier')}</th>
                <th className="font-medium">{t('common.label.betting')}</th>
                <th className="font-medium">{t('referral.label.commission')}</th>
                <th className="font-medium">{t('common.label.rate')}</th>
              </tr>
            </thead>
            <tbody>
              {rules.gameConfigs[key]?.map((row, idx) => (
                <tr key={idx} className="even:bg-table-even odd:bg-table-odd p-2 h-12">
                  <td>{row.tier}</td>
                  <td>{formatCurrency(row.amount, 0)}</td>
                  <td>{formatCurrency(row.bonus, 0)}</td>
                  <td>{Number(row.rate) * 100}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {rules?.rcgConfigs?.length > 0 && (
        <div className="rounded-lg mt-3 p-3 bg-light-gray dark:bg-gray text-main">
          <div className="flex items-center text-xs font-bold mb-2">
            <DiamondIcon className="size-4 mr-3" />
            {t('common.label.recharge')} {t('referral.label.commission')}
          </div>
          <table className="w-full text-xs text-center">
            <thead>
              <tr className="bg-table-header h-8">
                <th className="font-medium">{t('common.label.tier')}</th>
                <th className="font-medium">{t('referral.label.firstRecharge')}</th>
                <th className="font-medium">{t('referral.label.commission')}</th>
                <th className="font-medium">{t('common.label.rate')}</th>
              </tr>
            </thead>
            <tbody>
              {rules.rcgConfigs.map((row, idx) => (
                <tr key={idx} className="even:bg-table-even odd:bg-table-odd p-2 h-12">
                  <td>{row.tier}</td>
                  <td>{formatCurrency(row.amount, 0)}</td>
                  <td>{formatCurrency(row.bonus, 0)}</td>
                  <td>{Number(row.rate) * 100}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="capitalize text-xs leading-4 mt-5">
        <div className="flex">
          <BulletIcon />
          <div className="flex-1 ml-1">{t('referral.docs.commFootDoc1')}</div>
        </div>
        <div className="my-3 flex">
          <BulletIcon />
          <div className="flex-1 ml-1">{t('referral.docs.commFootDoc2')}</div>
        </div>
        <div className="flex">
          <BulletIcon />
          <div className="flex-1 ml-1">{t('referral.docs.commFootDoc3', { appName: document.title || 'App' })}</div>
        </div>
      </div>

      <AgentSprite pos="banner" className="w-full h-30.5 mt-5" />
    </div>
  )
}

const defaultPanel = {
  amountLast: 0, accountLast: 0,
  amountTotal: 0, amountCurrent: 0,
  accountTotal: 0, accountCurrent: 0,
  rcgAmountTotal: 0, rcgAmountCurrent: 0,
  betAmountTotal: 0, betAmountCurrent: 0,
  level: 1, inviteCode: '',
}

export const AgentPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isInIndex = useMemo(() => pathname.indexOf('/index/') > -1, [pathname])
  const [loading, setLoading] = useState(false)
  const [panel, setPanel] = useState<AgentPanel>(defaultPanel)
  const [rules, setRules] = useState<AgentRules>({ gameConfigs: {}, rcgConfigs: [] })
  const isDarkMode = document.documentElement.classList.contains('dark')
  const screenWidth = useUIStore((s) => s.screenWidth)
  const chatEnabled = useAppConfigStore((s) => s.support.chatEnabled)
  const [bgRatio, setBgRatio] = useState(0)
  useEffect(() => {
    const img = new window.Image()
    const apply = () => { if (img.naturalWidth) setBgRatio(img.naturalHeight / img.naturalWidth) }
    img.onload = apply
    img.src = '/images/agent/agent-info-bg-v3.webp'
    if (img.complete) apply()
  }, [])

  const scrollProgress = useMotionValue(0)
  const BG_HEIGHT = 337
  const CARD_OVERLAP = 28
  const bgPad = bgRatio ? Math.max(0, Math.min(BG_HEIGHT, screenWidth * bgRatio) - CARD_OVERLAP) : 0
  const bgTop = useTransform(scrollProgress, [0, 1], ['0px', `-${0.75 * BG_HEIGHT}px`])
  const headerFontSize = useTransform(scrollProgress, [0, 1], ['1rem', '0.875rem'])
  const headerColor = useTransform(
    scrollProgress,
    [0, 1],
    isDarkMode ? ['#fff', '#fff'] : ['#ffffff', '#2c2c2c'],
  )
  const csBtnSize = useTransform(scrollProgress, [0, 1], ['2.25rem', '1.5rem'])

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      const el = e.target as HTMLElement
      scrollProgress.set(Math.min(el.scrollTop / 2 / BG_HEIGHT, 1))
    },
    [scrollProgress],
  )

  const {
    sumReport,
    sumReportLoading,
    sumDateRange,
    handleDateRangeChange,
    fetchReport,
  } = useAgentSumReport()

  useEffect(() => {
    if (!checkAuth(false, false)) return
    withLoading(setLoading, Promise.allSettled([getAgentPanel(), getAgentRule(), fetchReport()]).then(([panelRes, ruleRes]) => {
      if (panelRes.status === 'fulfilled') setPanel(panelRes.value as AgentPanel)
      if (ruleRes.status === 'fulfilled') setRules(ruleRes.value as AgentRules)
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Spin loading={loading} className="size-full">
      <div className="size-full flex flex-col relative">

        <motion.div
          className="h-84 w-full bg-no-repeat bg-contain absolute left-0 z-0"
          style={{
            backgroundImage: 'url(/images/agent/agent-info-bg-v3.webp)',
            top: bgTop,
          }}
        >
          <div className="size-full bg-linear-to-b from-62% from-white/0 to-light-gray" />
        </motion.div>

        <motion.div
          className="px-2 py-2.5 flex justify-between items-center font-bold relative z-20"
          style={{ fontSize: headerFontSize, color: headerColor }}
        >
          <div className="flex items-center" onClick={isInIndex ? undefined : () => navigate(-1)}>
            {!isInIndex && (
              <svg className="text-current mr-2 size-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {t('referral.label.agentCenter')}
          </div>

          {chatEnabled && (
            <motion.div
              className="bg-primary rounded-full"
              style={{ width: csBtnSize, height: csBtnSize }}
            >
              <Image
                src="/images/common/cs.webp"
                radius="full"
                className="size-full"
                onClick={() => window.dispatchEvent(new CustomEvent('openCustomerService'))}
              />
            </motion.div>
          )}
        </motion.div>

        <ScrollShadow
          onScroll={handleScroll as React.UIEventHandler<HTMLElement>}
          className={clsx('px-3 flex-1 overflow-x-hidden', isInIndex && 'pb-16')}
          style={{ paddingTop: bgPad }}
          size={12}
        >
          <AgentPanelCard panel={panel} />
          <EntryCards />

          <AgentSumReport
            agentSumReport={sumReport}
            sumReportLoading={sumReportLoading}
            sumDateRange={sumDateRange}
            setSumDateRange={handleDateRangeChange}
          />
          <AgentRulesSection rules={rules} />

          <NavBarSpacer />
        </ScrollShadow>
      </div>
    </Spin>
  )
}

export default AgentPage
