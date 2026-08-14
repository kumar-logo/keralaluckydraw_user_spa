import { Button } from '@nextui-org/react'

const icons: Record<string, React.ReactNode> = {
  plus: (
    <svg xmlns="http://www.w3.org/2000/svg" width=".75rem" height=".75rem" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="5" width="10" height="2" rx="1" fill="var(--bg-icon-gray)" />
      <rect x="5" y="11" width="10" height="2" rx="1" transform="rotate(-90 5 11)" fill="var(--bg-icon-gray)" />
    </svg>
  ),
  minus: (
    <svg xmlns="http://www.w3.org/2000/svg" width=".75rem" height=".75rem" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="5" width="10" height="2" rx="1" fill="var(--bg-icon-gray)" />
    </svg>
  ),
}

interface CounterButtonProps {
  disabled?: boolean
  name?: 'plus' | 'minus'
  onClick?: () => void
}

export const CounterButton = ({ disabled = false, name = 'plus', onClick }: CounterButtonProps) => (
  <Button
    className={`px-0 min-w-0 gap-0 w-7 bg-selected! rounded-sm items-center justify-center ${disabled ? 'opacity-30' : ''}`}
    disabled={disabled}
    onPress={() => !disabled && onClick?.()}
  >
    {icons[name]}
  </Button>
)
