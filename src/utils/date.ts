const DISPLAY_TIME_ZONE = 'Asia/Kolkata'

const parseDate = (input: string | number | Date): Date | 'Invalid Date' => {
  if (input instanceof Date) return input
  let value: string | number = input
  if (typeof input === 'string') {
    const trimmed = input.trim()
    if (/^\d+$/.test(trimmed)) {
      value = Number(trimmed)
    } else {
      let normalized = trimmed.replace(' ', 'T')
      if (/T\d{2}:\d{2}/.test(normalized) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized)) normalized += 'Z'
      value = normalized
    }
  }
  const d = new Date(value)
  return isNaN(d.getTime()) ? 'Invalid Date' : d
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface ZonedParts {
  year: number
  monthIndex: number
  day: number
  hours: number
  minutes: number
  seconds: number
  weekdayIndex: number
}

const zonedPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: DISPLAY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  weekday: 'short',
  hour12: false,
})

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

const toZonedParts = (date: Date): ZonedParts => {
  const lookup: Record<string, string> = {}
  for (const part of zonedPartsFormatter.formatToParts(date)) {
    lookup[part.type] = part.value
  }
  const hour = Number(lookup.hour)
  return {
    year: Number(lookup.year),
    monthIndex: Number(lookup.month) - 1,
    day: Number(lookup.day),
    hours: hour === 24 ? 0 : hour,
    minutes: Number(lookup.minute),
    seconds: Number(lookup.second),
    weekdayIndex: WEEKDAY_INDEX[lookup.weekday] ?? 0,
  }
}

export function formatDate(dateInput: string | number | Date | null | undefined, pattern = 'yyyy-MM-dd hh:mm:ss'): string {
  if (dateInput === null || dateInput === undefined || dateInput === '') return '--'
  const date = parseDate(dateInput)
  if (date === 'Invalid Date') return '--'

  const parts = toZonedParts(date)
  const year = parts.year.toString()
  const month = (parts.monthIndex + 1).toString().padStart(2, '0')
  const day = parts.day.toString().padStart(2, '0')
  const hours = parts.hours
  const isPM = hours > 11
  const uses12h = pattern.indexOf('hh') > -1
  const h12 = hours % 12 === 0 ? 12 : hours % 12
  const minutes = parts.minutes.toString().padStart(2, '0')
  const seconds = parts.seconds.toString().padStart(2, '0')

  return (
    pattern
      .replace('yyyy', year)
      .replace('yy', year.substring(2))
      .replace('MMMM', MONTHS[parts.monthIndex])
      .replace('MM', month)
      .replace('Mon', SHORT_MONTHS[parts.monthIndex])
      .replace('dddd', DAYS[parts.weekdayIndex])
      .replace('dd', day)
      .replace('suffix', day === '1' ? 'st' : day === '2' ? 'ed' : day === '3' ? 'rd' : 'th')
      .replace('HH', hours.toString().padStart(2, '0'))
      .replace('hh', h12.toString().padStart(2, '0'))
      .replace('mm', minutes)
      .replace('ss', seconds) + (uses12h ? (isPM ? ' PM' : ' AM') : '')
  )
}

export function formatDuration(ms: number): { days: number; hours: number; minutes: number; seconds: number } {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds }
}
