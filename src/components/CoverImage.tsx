import { useState, useEffect } from 'react';

type Props = {
  urls: string[];
  alt: string;
  className: string;
  fallback: React.ReactNode;
};

export function CoverImage({ urls, alt, className, fallback }: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [urls.join(',')]);

  const current = urls[idx];

  if (!current) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={current}
      alt={alt}
      loading="lazy"
      onError={() => setIdx((i) => i + 1)}
      className={className}
    />
  );
}
