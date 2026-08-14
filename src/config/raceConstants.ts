
export enum BetType {
  Champion = 1,
  Top3Fixed = 2,
  WinningGroup = 3,
  Top3Any = 4,
  Top3Random = 5,
}

export interface RaceRunner {
  name: string
  nameShort: string
  colorHex: string
  spriteKey: string
}

export interface RaceDrawResult {
  positions: number[]
  drawResult: string
  champion: number
  second: number
  third: number
  top3: string
  runnerCount: number
}

export interface RaceBetInfoEntry {
  type: number
  num: string
}

export interface RaceBetInfo {
  roundNo: string
  list: RaceBetInfoEntry[]
}

export const parseRaceTop3 = (top3: string): number[] =>
  top3.split(',').map((value) => parseInt(value, 10))

export const stateNames = [
  'Kerala',
  'Tamil',
  'MadhyaPradesh',
  'Maharashtra',
  'Karnataka',
  'Nagaland',
]

export const stateColors = [
  '#00B92B',
  '#D80000',
  '#F5D000',
  '#DB7500',
  '#B800D0',
  '#0012D4',
]

export const getRunnerState = (runnerNum: number, isSingle: boolean, runnerCount = 6): number =>
  isSingle ? runnerNum - 1 : Math.floor((runnerNum - 1) / 2) % Math.max(runnerCount, 1)

export const getRaceStateNames = (
  _runnerCount: number,
  raceRunners?: { name: string }[] | null,
): string[] => (raceRunners?.length ? raceRunners.map((r) => r.name) : stateNames)

export const getRaceStateColors = (
  _runnerCount: number,
  raceRunners?: { colorHex: string }[] | null,
): string[] => (raceRunners?.length ? raceRunners.map((r) => r.colorHex) : stateColors)

export const defaultPayRate: { type: BetType; odds: number }[] = [
  { type: BetType.Champion, odds: 5.4 },
  { type: BetType.Top3Any, odds: 1.85 },
  { type: BetType.Top3Random, odds: 17 },
]

export const CURRENCY = '₹'

export const APP_NAME = 'Kerala Lucky Draw'
export const APP_SHORT = 'KeralaLuckyDraw'
