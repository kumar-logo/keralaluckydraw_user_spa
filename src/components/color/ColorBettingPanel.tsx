import { useState, useMemo, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@nextui-org/react'
import { motion } from 'framer-motion'
import { OutlineBall, FullBall } from '../shared/WingoBall'

function generateBalls(size = 56, disabled = false, border = false) {
  return Array(10).fill(0).map((_, i) => (
    <OutlineBall key={i} border={border} size={size} content={i} disabled={disabled} />
  ))
}

export interface ColorBettingPanelRef {
  addDrop: (item: number | string) => void
  allDrop: (items: (number | string)[]) => void
}

interface ColorBettingPanelProps {
  canBetting: boolean
  onPay: (item: number | string) => void
}

export const ColorBettingPanel = forwardRef<ColorBettingPanelRef, ColorBettingPanelProps>(
  ({ canBetting, onPay }, ref) => {
    const balls = useMemo(() => generateBalls(56, !canBetting, true), [canBetting])
    const [bets, setBets] = useState<(number | string)[]>([])

    useImperativeHandle(ref, () => ({
      addDrop(item) {
        setBets((prev) => [...prev, item])
      },
      allDrop(items) {
        setBets(items)
      },
    }), [])

    return (
      <div className="flex flex-col bg-white dark:bg-selected">
        <div className="flex gap-x-2 px-2 py-3 bg-light-gray dark:bg-gray mx-2 mt-2">
          <Button
            isDisabled={!canBetting}
            onPress={() => onPay?.('GREEN')}
            className={`flex flex-1 items-center justify-center rounded-none rounded-l-3xl text-sm text-white font-bold wingo-machine-item wingo-machine-${canBetting ? 'green' : 'disabled'}`}
          >
            GREEN
          </Button>
          <Button
            isDisabled={!canBetting}
            onPress={() => onPay?.('VIOLET')}
            className={`flex flex-1 items-center justify-center rounded-none text-sm text-white font-bold wingo-machine-item wingo-machine-${canBetting ? 'violet' : 'disabled'}`}
          >
            VIOLET
          </Button>
          <Button
            isDisabled={!canBetting}
            onPress={() => onPay?.('RED')}
            className={`flex flex-1 items-center justify-center rounded-none rounded-r-3xl text-sm text-white font-bold wingo-machine-item wingo-machine-${canBetting ? 'red' : 'disabled'}`}
          >
            RED
          </Button>
        </div>
        <div className="px-5 py-4 relative flex flex-wrap gap-y-3 justify-between bg-light-gray dark:bg-gray mx-2 mb-2">
          {balls.map((ball, idx) => (
            <Button
              key={idx}
              isDisabled={!canBetting}
              onPress={() => onPay?.(idx)}
              className="px-0 min-w-0 gap-0 h-auto bg-transparent rounded-full shadow-25"
            >
              {ball}
            </Button>
          ))}
        </div>
        <div className="flex flex-col bg-[#cecece] dark:bg-[#464E59] px-2 pb-2">
          <div className="flex justify-between items-center mb-1">
            <div className="wingo-machine-parting-line" />
            <p className="din text-sm font-bold">MY BETS</p>
            <div className="wingo-machine-parting-line" />
          </div>
          <div className="wingo-machine-bottom-inner relative rounded-sm h-15 w-full overflow-hidden">
            <div className="flex overflow-x-auto w-full h-full items-center px-3 *:not-last:mr-1">
              {bets.map((item, idx) => (
                <motion.div
                  key={idx}
                  animate={{ scale: [0.9, 1.1, 1] }}
                  transition={{ duration: 1 }}
                  className="z-10"
                >
                  <FullBall size={36} content={item} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

ColorBettingPanel.displayName = 'ColorBettingPanel'
