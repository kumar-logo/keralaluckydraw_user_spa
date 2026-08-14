import { memo } from 'react'
import { RaceSpriteIcon } from './RaceSpriteIcon'
import { stateColors, RaceRunner } from '../../config/raceConstants'

const STATE_SPRITE_NAMES = ['kerala', 'tamil', 'madhya', 'maharashtra', 'karnataka', 'nagaland']
const PLAYER_SPRITE_NAMES = ['keralaPlayer', 'tamilPlayer', 'madhyaPlayer', 'maharashtraPlayer', 'karnatakaPlayer', 'nagalandPlayer']

const getStateSpriteKey = (state: number, isPlayer: boolean) => {
  const list = isPlayer ? PLAYER_SPRITE_NAMES : STATE_SPRITE_NAMES
  return list[state] ?? list[0]
}

export const GroupBadge = memo(({ state, size = 24, isPlayer }: { state: number; size?: number; isPlayer?: boolean }) => {
  const scale = size / 32
  const remSize = size / 16
  return (
    <RaceSpriteIcon
      pos={getStateSpriteKey(state, !!isPlayer)}
      scale={scale}
      style={{ width: remSize + 'rem', height: remSize + 'rem' }}
    />
  )
})

export const PlayerBadge = memo(({ state, size = 20, raceRunners }: { state: number; size?: number; raceRunners?: RaceRunner[] | null }) => {
  const badgeSize = size / 16 + 0.25 + 'rem'
  const color = raceRunners?.[state]?.colorHex ?? stateColors[state % stateColors.length]
  return (
    <div
      className="p-0.5 rounded-full"
      style={{ backgroundColor: color, width: badgeSize, height: badgeSize }}
    >
      <GroupBadge state={state} size={size} isPlayer />
    </div>
  )
})

const RANK_SPRITE_NAMES = ['rankTop1', 'rankTop2', 'rankTop3']

export const RankBadge = memo(({ no, size = 24 }: { no: number; size?: number }) => {
  const scale = size / 24
  const remSize = size / 16
  return (
    <RaceSpriteIcon
      pos={RANK_SPRITE_NAMES[no]}
      scale={scale}
      style={{ width: remSize + 'rem', height: remSize + 'rem' }}
    />
  )
})

export const ChampionIcon = memo(() => <RaceSpriteIcon pos="championIcon" className="size-5" />)
export const TeamIcon = memo(() => <RaceSpriteIcon pos="teamIcon" className="size-5" />)
export const Top3Icon = memo(() => <RaceSpriteIcon pos="top3Icon" className="size-5" />)

export const BetTagIcon = memo(() => (
  <RaceSpriteIcon pos="betTagIcon" className="size-4 absolute! top-1/2 -mt-2 left-0 -ml-5" />
))
