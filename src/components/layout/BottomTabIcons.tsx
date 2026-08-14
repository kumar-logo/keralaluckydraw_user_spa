type IconProps = { active: boolean }

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  xmlns: 'http://www.w3.org/2000/svg',
}

export const HomeIcon = ({ active }: IconProps) => (
  <svg {...svgProps} data-active={active}>
    <path className="an-ico-blob" d="M3.8 10.7 12 4.3l8.2 6.4v8.2a1.6 1.6 0 0 1-1.6 1.6H5.4a1.6 1.6 0 0 1-1.6-1.6z" stroke="none" />
    <path className="an-ico-stroke" pathLength={1} d="M3.8 10.7 12 4.3l8.2 6.4v8.2a1.6 1.6 0 0 1-1.6 1.6H5.4a1.6 1.6 0 0 1-1.6-1.6z" />
    <path className="an-ico-stroke" pathLength={1} d="M9.7 20.5v-4.9a2.3 2.3 0 0 1 4.6 0v4.9" />
  </svg>
)

export const ResultIcon = ({ active }: IconProps) => (
  <svg {...svgProps} data-active={active}>
    <circle className="an-ico-blob" cx="12" cy="12" r="8.3" stroke="none" />
    <circle className="an-ico-stroke" pathLength={1} cx="12" cy="12" r="8.3" />
    <path className="an-ico-stroke" pathLength={1} d="M12 7.4v4.9l3.3 1.9" />
  </svg>
)

const TICKET = 'M5 6.6h14a1.8 1.8 0 0 1 1.8 1.8v2a1.7 1.7 0 0 0 0 3.2v2a1.8 1.8 0 0 1-1.8 1.8H5a1.8 1.8 0 0 1-1.8-1.8v-2a1.7 1.7 0 0 0 0-3.2v-2A1.8 1.8 0 0 1 5 6.6z'

export const MyBetsIcon = ({ active }: IconProps) => (
  <svg {...svgProps} data-active={active}>
    <path className="an-ico-blob" d={TICKET} stroke="none" />
    <path className="an-ico-stroke" pathLength={1} d={TICKET} />
    <path className="an-ico-stroke" pathLength={1} d="M13.7 9.1v1.5M13.7 12.4v1.5M13.7 15.7v-.6" />
  </svg>
)

export const ProfileIcon = ({ active }: IconProps) => (
  <svg {...svgProps} data-active={active}>
    <circle className="an-ico-blob" cx="12" cy="8.4" r="3.7" stroke="none" />
    <path className="an-ico-blob" d="M4.9 19.6a7.1 7.1 0 0 1 14.2 0z" stroke="none" />
    <circle className="an-ico-stroke" pathLength={1} cx="12" cy="8.4" r="3.7" />
    <path className="an-ico-stroke" pathLength={1} d="M4.9 19.6a7.1 7.1 0 0 1 14.2 0" />
  </svg>
)
