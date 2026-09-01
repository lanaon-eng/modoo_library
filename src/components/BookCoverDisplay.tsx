import { useState, useEffect } from 'react';

type Props = {
  urls: string[];
  alt: string;
  fallback: React.ReactNode;
  containerClassName?: string;
  coverClassName?: string;
};

export function BookCoverDisplay({
  urls,
  alt,
  fallback,
  containerClassName = 'h-56',
  coverClassName = 'max-h-[240px] max-w-full',
}: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [urls.join(',')]);

  const current = urls[idx];

  if (!current) {
    return (
      <div className={`relative w-full overflow-hidden bg-ink-100 dark:bg-ink-800 ${containerClassName}`}>
        {fallback}
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden bg-ink-900 ${containerClassName}`}>
      {/* Blurred background */}
      <img
        src={current}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl brightness-50"
      />
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/40" />
      {/* Centered cover with contain */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <img
          src={current}
          alt={alt}
          loading="lazy"
          onError={() => setIdx((i) => i + 1)}
          className={`${coverClassName} w-auto rounded-lg object-contain drop-shadow-2xl`}
        />
      </div>
    </div>
  );
}
