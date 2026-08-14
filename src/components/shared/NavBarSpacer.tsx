import clsx from 'clsx'

export const NavBarSpacer = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('w-full h-(--nav-bar-height) shrink-0', className)} {...props} />
)
