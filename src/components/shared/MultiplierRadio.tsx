import { Radio, type RadioProps } from '@nextui-org/react'

export const MultiplierRadio = (props: RadioProps) => {
  const { children, ...rest } = props
  return (
    <Radio
      {...rest}
      classNames={{
        base: 'bg-selected border border-selected flex-1 h-8 p-0 m-0 items-center justify-center rounded-sm max-w-full font-bold data-[selected=true]:border-primary',
        control: 'hidden',
        wrapper: 'hidden',
        labelWrapper: 'ml-0',
        label: 'text-xs text-sec group-data-[selected=true]:text-primary',
      }}
    >
      {children}
    </Radio>
  )
}
