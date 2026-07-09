import type { FC } from 'react'

interface BrandImageProps {
  type: 'logo' | 'avatar'
  alt: string
  className?: string
  darkClassName?: string
  lightClassName?: string
}

const brandSources = {
  logo: {
    dark: '/brand/maxai-logo-dark.png',
    light: '/brand/maxai-logo-light.png',
  },
  avatar: {
    dark: '/brand/maxai-avatar-dark.png',
    light: '/brand/maxai-avatar-light.png',
  },
}

const BrandImage: FC<BrandImageProps> = ({
  type,
  alt,
  className = '',
  darkClassName = '',
  lightClassName = '',
}) => {
  const source = brandSources[type]

  return (
    <>
      <img
        className={`brand-image-light ${className} ${lightClassName}`.trim()}
        alt={alt}
        src={source.light}
      />
      <img
        className={`brand-image-dark ${className} ${darkClassName}`.trim()}
        alt={alt}
        src={source.dark}
      />
    </>
  )
}

export default BrandImage
