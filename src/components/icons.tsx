import type { JSX } from 'react'

type Props = { className?: string }

const wrap = (children: JSX.Element, className?: string): JSX.Element => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    {children}
  </svg>
)

export const IconLibrary = ({ className }: Props): JSX.Element =>
  wrap(
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 4v5M16 4v5M8 20v-5M16 20v-5" />
    </>,
    className
  )

export const IconHeart = ({ className }: Props): JSX.Element =>
  wrap(
    <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1z" />,
    className
  )

export const IconPlus = ({ className }: Props): JSX.Element =>
  wrap(<path d="M12 5v14M5 12h14" />, className)

export const IconSettings = ({ className }: Props): JSX.Element =>
  wrap(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </>,
    className
  )

export const IconSearch = ({ className }: Props): JSX.Element =>
  wrap(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>,
    className
  )

export const IconCheck = ({ className }: Props): JSX.Element =>
  wrap(<path d="m5 13 4 4L19 7" />, className)

export const IconClose = ({ className }: Props): JSX.Element =>
  wrap(<path d="M6 6l12 12M18 6 6 18" />, className)

export const IconTrash = ({ className }: Props): JSX.Element =>
  wrap(
    <>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </>,
    className
  )

export const IconDownload = ({ className }: Props): JSX.Element =>
  wrap(<path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />, className)

export const IconUpload = ({ className }: Props): JSX.Element =>
  wrap(<path d="M12 21V9m0 0 4 4m-4-4-4 4M4 5h16" />, className)

export const IconFilm = ({ className }: Props): JSX.Element =>
  wrap(
    <>
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M7 3v18M17 3v18M2 9h5M17 9h5M2 15h5M17 15h5" />
    </>,
    className
  )

export const IconEye = ({ className }: Props): JSX.Element =>
  wrap(
    <>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.6" />
    </>,
    className
  )

export const IconRefresh = ({ className }: Props): JSX.Element =>
  wrap(
    <>
      <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
      <path d="M3 21v-5h5" />
    </>,
    className
  )

export const IconFolder = ({ className }: Props): JSX.Element =>
  wrap(<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />, className)

export const IconStar = ({ className }: Props): JSX.Element => (
  <svg viewBox="0 0 24 24" className={`solid${className ? ` ${className}` : ''}`} aria-hidden="true">
    <path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9z" />
  </svg>
)

export const IconChevronLeft = ({ className }: Props): JSX.Element =>
  wrap(<path d="m15 5-7 7 7 7" />, className)

export const IconChevronRight = ({ className }: Props): JSX.Element =>
  wrap(<path d="m9 5 7 7-7 7" />, className)

export const IconInfo = ({ className }: Props): JSX.Element =>
  wrap(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>,
    className
  )

export const IconPlay = ({ className }: Props): JSX.Element => (
  <svg viewBox="0 0 24 24" className={`solid${className ? ` ${className}` : ''}`} aria-hidden="true">
    <path d="M6 4.5v15l13-7.5z" />
  </svg>
)

export const IconSparkle = ({ className }: Props): JSX.Element =>
  wrap(
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />,
    className
  )
