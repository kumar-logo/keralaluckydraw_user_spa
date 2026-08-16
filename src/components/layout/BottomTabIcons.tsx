const strokeProps = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  xmlns: 'http://www.w3.org/2000/svg',
}

const lineProps = {
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const HomeIcon = () => (
  <svg {...strokeProps}>
    <path {...lineProps} d="M3 11l9-7 9 7" />
    <path {...lineProps} d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
  </svg>
)

export const ResultIcon = () => (
  <svg {...strokeProps}>
    <circle {...lineProps} cx="9" cy="9" r="6" />
    <path {...lineProps} d="M9 6.5v5M7 8h4" />
    <path {...lineProps} d="M15 12a6 6 0 1 0-3.7 5.54" />
  </svg>
)

export const TicketsIcon = () => (
  <svg {...strokeProps}>
    <rect {...lineProps} x="4" y="9" width="16" height="11" rx="1" />
    <path {...lineProps} d="M4 9h16M12 9v11M12 9c-1.5-3-3.5-4-5-3s-1 3 0 3M12 9c1.5-3 3.5-4 5-3s1 3 0 3" />
  </svg>
)

export const AccountIcon = () => (
  <svg {...strokeProps}>
    <circle {...lineProps} cx="12" cy="8" r="3.5" />
    <path {...lineProps} d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
  </svg>
)

export const SupportGlyph = () => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.6 1.9 6.5L4 29l7.7-1.8c1.9 1 4 1.6 6.3 1.6 6.6 0 12-5.4 12-12S22.6 3 16 3zm6.9 17.1c-.3.8-1.6 1.5-2.2 1.6-.6.1-1.3.1-2.1-.1-.5-.1-1.1-.3-1.9-.7-3.4-1.5-5.6-4.9-5.8-5.1-.2-.2-1.4-1.8-1.4-3.5s.9-2.5 1.2-2.8c.3-.3.7-.4.9-.4h.6c.2 0 .5 0 .7.5.3.7.9 2.3 1 2.5.1.2.2.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.5-.6.6-.2.2-.4.4-.2.8.2.4 1 1.6 2.1 2.6 1.4 1.3 2.6 1.7 3 1.9.4.2.6.2.8-.1.2-.3.9-1.1 1.2-1.4.3-.3.5-.3.9-.2.4.1 2.2 1 2.6 1.2.4.2.6.3.7.5.1.2.1.9-.2 1.7z" />
  </svg>
)
