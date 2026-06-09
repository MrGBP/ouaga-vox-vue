import { ImgHTMLAttributes, useState } from 'react';

const FALLBACK = '/placeholder-property.svg';

interface PropertyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
}

/**
 * <img> resiliente : si l'URL est vide ou casse, on remplace par
 * /placeholder-property.svg (icône maison sur fond gris clair).
 */
export default function PropertyImage({ src, alt, ...rest }: PropertyImageProps) {
  const [url, setUrl] = useState<string>(src && src.trim().length > 0 ? src : FALLBACK);
  return (
    <img
      {...rest}
      src={url}
      alt={alt ?? 'bien'}
      loading={rest.loading ?? 'lazy'}
      onError={() => { if (url !== FALLBACK) setUrl(FALLBACK); }}
    />
  );
}
