import { Button, Image } from '@nextui-org/react'
import { formatDate } from '../../utils/date'
import { ColorResult } from '../four_five_digit/ColorBall'
import { PositionConfigProvider } from '../../config/positionConfig'
import { ChevronIcon } from '../shared/ChevronIcon'

interface ResultRowCardProps {
  icon?: string
  gameName?: string
  result?: string
  drawTime?: string | number
  onPress?: () => void
  colors?: string[]
  labels?: string[]
}

export const ResultRowCard = ({
  icon,
  gameName,
  result = '',
  drawTime = 0,
  onPress,
  colors,
  labels,
}: ResultRowCardProps) => (
  <Button
    onPress={onPress}
    className="bg-white dark:bg-gray flex-row flex rounded-sm justify-between p-3 h-[unset] shrink-0"
  >
    <div>
      {icon ? <Image src={icon} radius="none" className="h-9 z-0! object-contain" /> : null}
      <p className="text-sm font-bold text-main mt-1">{gameName}</p>
    </div>
    <div className="flex items-center gap-x-2">
      <div className="flex flex-col items-end gap-y-1">
        <p className="text-xs font-bold text-main">{formatDate(drawTime, 'MMMM ddsuffix hh:mm')}</p>
        <div className="flex items-center gap-x-1">
          <PositionConfigProvider colors={colors} labels={labels}>
            <ColorResult result={result} />
          </PositionConfigProvider>
        </div>
      </div>
      <ChevronIcon />
    </div>
  </Button>
)
