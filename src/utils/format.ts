const CURRENCY = '₹'

const LOCALE_MAP: Record<string, string> = {
  '₹': 'en-IN',
  INR: 'en-IN',
}

const formatLocale = (value: number, locale: string, precision = 0) =>
  value.toLocaleString(locale, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })

interface FormatOptions {
  amount: number | string
  precision?: number
  hideSymbol?: boolean
  abbreviate?: boolean
  trimTrailingZero?: boolean
}

const formatAmount = ({ amount, precision = 2, hideSymbol = false, abbreviate = false, trimTrailingZero = false }: FormatOptions): string => {
  let num = typeof amount === 'number' ? amount : Number(amount)
  if (num !== num) {
    console.error('amount value is illegal', amount)
    num = 0
  }

  let result = ''
  const locale = LOCALE_MAP[CURRENCY]

  if (abbreviate && num > 1e6) {
    const tiers = [
      { value: 1e9, symbol: 'B' },
      { value: 1e6, symbol: 'M' },
      { value: 1e3, symbol: 'K' },
    ]
    const tier = tiers.find((t) => Math.abs(num) >= t.value)
    if (tier) {
      const scaled = Math.floor(num / tier.value)
      result = formatLocale(scaled, locale) + tier.symbol
    }
  }

  if (!result) {
    result = formatLocale(num, locale, precision)
  }

  if (trimTrailingZero && !abbreviate) {
    result = result.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '')
  }

  if (hideSymbol) return result

  const dir = typeof document !== 'undefined' ? document.dir : 'ltr'
  const neg = result.startsWith('-')
  const magnitude = neg ? result.slice(1) : result
  return (neg ? '-' : '') + (dir === 'rtl' ? magnitude + CURRENCY : CURRENCY + magnitude)
}

export function formatCurrency(input: FormatOptions): string
export function formatCurrency(amount: number | string, precision?: number, trimTrailingZero?: boolean): string
export function formatCurrency(amountOrOptions: FormatOptions | number | string, precision: number = 2, trimTrailingZero: boolean = false): string {
  return formatAmount(
    typeof amountOrOptions !== 'object' || amountOrOptions === null
      ? {
          amount: (amountOrOptions as number) ?? 0,
          precision: typeof precision === 'number' ? precision : 0,
          hideSymbol: false,
          abbreviate: typeof precision === 'boolean' ? precision : false,
          trimTrailingZero,
        }
      : {
          amount: amountOrOptions.amount,
          precision: amountOrOptions.precision ?? 2,
          hideSymbol: amountOrOptions.hideSymbol ?? false,
          abbreviate: amountOrOptions.abbreviate ?? false,
          trimTrailingZero: amountOrOptions.trimTrailingZero ?? false,
        }
  )
}
