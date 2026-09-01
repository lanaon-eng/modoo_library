import { useEffect, useRef, useState } from 'react';
import { X, Download, Share2, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { ReadingCard } from '@/types';
import { ReadingCardView } from './ReadingCardView';

type Props = {
  card: ReadingCard | null;
  open: boolean;
  onClose: () => void;
  nickname?: string;
};

export function CardViewerModal({ card, open, onClose, nickname }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) {
      setSaved(false);
      setSaving(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !card) return null;

  const handleSave = async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `booklog-${card.bookTitle}.png`;
      link.href = dataUrl;
      link.click();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) return;

      const file = new File([blob], `booklog-${card.bookTitle}.png`, {
        type: 'image/png',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: `"${card.insight}" — ${card.bookTitle} 속 ${card.characterName}와의 대화`,
          title: '내 독서 카드',
        });
      } else {
        // Fallback: download
        handleSave();
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-sm animate-scale-in flex-col items-center overflow-y-auto px-4 py-6 no-scrollbar">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
        >
          <X size={20} />
        </button>

        {/* Card preview */}
        <div className="rounded-2xl shadow-2xl">
          <ReadingCardView ref={cardRef} card={card} nickname={nickname} />
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex w-full gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3 text-[13px] font-bold text-ink-900 shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {saved ? (
              <>
                <Check size={17} className="text-green-500" />
                저장 완료!
              </>
            ) : (
              <>
                <Download size={17} />
                이미지 저장하기
              </>
            )}
          </button>
          <button
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-[13px] font-bold text-white shadow-md shadow-brand-500/30 transition-all hover:scale-[1.02] hover:bg-brand-600 active:scale-95"
          >
            <Share2 size={17} />
            스토리로 공유
          </button>
        </div>
        <p className="mt-3 text-[11px] text-white/50">
          친구들에게 나의 독서 인사이트를 공유해보세요
        </p>
      </div>
    </div>
  );
}
