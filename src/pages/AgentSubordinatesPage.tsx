import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, ScrollShadow, Tabs, Tab } from '@nextui-org/react'
import { getAgentTable } from '../services/financeApi'
import { formatDate } from '../utils/date'
import { formatCurrency } from '../utils/format'
import { withLoading, resolveAssetUrl } from '../utils/helpers'
import { TopBar } from '../components/shared/TopBar'
import { Spin } from '../components/shared/Spin'

interface Subordinate {
  userId: string
  nickname: string
  avatar: string
  registerTime: string | number
  totalBet: number
  totalRecharge: number
  level: number
}

export const AgentSubordinatesPage = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [level, setLevel] = useState(1)
  const [list, setList] = useState<Subordinate[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [brokenAvatars, setBrokenAvatars] = useState<Record<string, boolean>>({})

  const loadData = useCallback((lvl: number, pageNum: number, replace = false) => {
    const setter = pageNum === 1 ? setLoading : setLoadingMore
    withLoading(setter, getAgentTable({ level: lvl, pageNo: pageNum, pageSize: 10 }).then((raw) => {
      const data = raw as { content?: Subordinate[]; list?: Subordinate[] } | null
      const content = data?.content || data?.list || []
      if (replace) {
        setList(content)
      } else {
        setList((prev) => [...prev, ...content])
      }
      setHasMore(content.length >= 10)
      setPage(pageNum)
    }))
  }, [])

  useEffect(() => {
    loadData(level, 1, true)
  }, [level, loadData])

  return (
    <div className="size-full flex flex-col">
      <TopBar title={t('agent.label.subordinates')} />

      <div className="bg-white dark:bg-gray px-2">
        <Tabs
          selectedKey={level + ''}
          onSelectionChange={(k) => { setLevel(Number(k)); setPage(1) }}
          classNames={{
            base: 'w-full',
            tabList: 'w-full flex p-0',
            tab: 'flex-1 h-10',
          }}
        >
          <Tab key="1" title={t('agent.label.level1')} />
          <Tab key="2" title={t('agent.label.level2')} />
        </Tabs>
      </div>

      <Spin className="flex-1 flex flex-col" loading={loading}>
        <ScrollShadow className="flex-1 p-2">
          {list.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-acc">
              <svg className="size-16 mb-4 opacity-30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6H4V4h16v2zm-2 6H6V10h12v2zm-4 6H10v-2h4v2z" />
              </svg>
              <p className="text-sm">{t('common.label.noData')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((item) => (
                <div key={item.userId} className="p-3 bg-white dark:bg-gray rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      {item.avatar && !brokenAvatars[item.userId] ? (
                        <img
                          src={resolveAssetUrl(item.avatar)}
                          alt=""
                          className="size-10 rounded-full object-cover"
                          onError={() => setBrokenAvatars((prev) => ({ ...prev, [item.userId]: true }))}
                        />
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          {(item.nickname || 'U')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-main truncate">{item.nickname || item.userId}</div>
                      <div className="text-[10px] text-acc">ID: {item.userId}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-selected">
                    <div className="text-xs text-acc">
                      {t('agent.label.registered')}: {formatDate(item.registerTime, 'yyyy-MM-dd')}
                    </div>
                    <div className="text-xs text-acc">
                      {t('agent.label.totalBet')}: {formatCurrency(item.totalBet, 0)}
                    </div>
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="flex justify-center py-3">
                  <Button
                    size="sm"
                    isLoading={loadingMore}
                    className="text-xs text-primary bg-transparent font-bold"
                    onPress={() => loadData(level, page + 1)}
                  >
                    {t('common.label.loadMore')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollShadow>
      </Spin>
    </div>
  )
}

export default AgentSubordinatesPage
