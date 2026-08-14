import clsx from 'clsx'

interface TicketCardProps extends React.HTMLAttributes<HTMLDivElement> {
  cardClassName?: string
  bgColor?: string
  children?: React.ReactNode
}

export const TicketCard = ({ children, cardClassName, className, bgColor, ...rest }: TicketCardProps) => (
  <div
    {...rest}
    className={clsx('p-2 relative overflow-hidden', className)}
    style={{ backgroundColor: bgColor }}
  >
    <div className={'p-3 rounded-lg ' + cardClassName}>
      {children}
    </div>

    <div
      className="absolute top-[50%] size-6 -mt-3 -left-2.5 rounded-full"
      style={{ backgroundColor: bgColor }}
    />

    <div
      className="absolute top-[50%] size-6 -mt-3 -right-2.5 rounded-full"
      style={{ backgroundColor: bgColor }}
    />
  </div>
)
