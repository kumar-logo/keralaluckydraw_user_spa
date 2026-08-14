import { Radio, type RadioProps } from '@nextui-org/react'

export const AmountRadio = (props: RadioProps) => {
  const { children, ...rest } = props
  return (
    <Radio
      {...rest}
      classNames={{
        base: 'flex-1 h-10 p-0 m-0 items-center justify-center rounded-sm max-w-full text-main font-bold bg-light-gray dark:bg-gray data-[selected=true]:bg-primary!',
        control: 'hidden',
        wrapper: 'hidden',
        labelWrapper: 'ml-0',
        label: 'text-sm text-sec group-data-[selected=true]:text-black',
      }}
    >
      {children}
    </Radio>
  )
}
