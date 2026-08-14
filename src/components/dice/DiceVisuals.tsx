export const DiceSingle = ({ num, size = 20 }: { num: number; size?: number }) => {
  const rem = size / 16
  return num >= 1 && num <= 6 ? (
    <div className={`k3-single-${num}`} style={{ width: `${rem}rem`, height: `${rem}rem` }} />
  ) : (
    <div className="k3-single-question" style={{ width: `${rem}rem`, height: `${rem}rem` }} />
  )
}

export const DiceNum = ({ num, size = 36, flat, emptyChar = '?' }: { num: number; size?: number; flat?: boolean; emptyChar?: string }) => {
  const isFlat = size < 40 || flat
  const rem = size / 16
  const fontSize = size * 28 / 48 / 16
  return (
    <div
      className={`dice-num-${num % 2 === 0 ? 'green' : 'red'} rounded-full items-center text-black/80 justify-center din flex text-center font-bold${isFlat ? ' dice-num-flat' : ''}`}
      style={{ width: `${rem}rem`, height: `${rem}rem`, fontSize: `${fontSize}rem` }}
    >
      {num || emptyChar}
    </div>
  )
}

const badgeMap: Record<string, { title: string; subTitle: string }> = {
  big: { title: 'B', subTitle: 'Big' },
  small: { title: 'S', subTitle: 'Small' },
  odd: { title: 'O', subTitle: 'Odd' },
  even: { title: 'E', subTitle: 'Even' },
}

export const DiceSumBadge = ({ type, size = 48, flat, emptyChar = '?' }: { type?: string; size?: number; flat?: boolean; emptyChar?: string }) => {
  const isFlat = size < 40 || flat
  const rem = size / 16
  const info = type ? badgeMap[type] : undefined
  return (
    <div
      className={`flex text-10 font-bold flex-col din justify-center items-center rounded-full dice-sum-${type}${isFlat ? ' dice-sum-flat' : ''}`}
      style={{ width: `${rem}rem`, height: `${rem}rem` }}
    >
      <span className={`leading-4 ${isFlat ? 'text-xs' : 'text-lg'}`}>{info ? info.title : emptyChar}</span>
      {!isFlat && (info ? info.subTitle : emptyChar)}
    </div>
  )
}
