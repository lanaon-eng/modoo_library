import { useEffect, useState } from 'react';
import { Volume2, VolumeX, X, Play, Pause, Music } from 'lucide-react';
import { TRACKS, type TrackId } from '@/lib/audioEngine';

type Props = {
  isPlaying: boolean;
  currentTrack: TrackId | null;
  volume: number;
  onToggle: (track: TrackId) => void;
  onStop: () => void;
  onVolumeChange: (v: number) => void;
};

export function BgmPlayer({
  isPlaying,
  currentTrack,
  volume,
  onToggle,
  onStop,
  onVolumeChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.5);

  useEffect(() => {
    if (!isPlaying) setOpen(false);
  }, [isPlaying]);

  const handleMute = () => {
    if (muted) {
      onVolumeChange(prevVolume);
      setMuted(false);
    } else {
      setPrevVolume(volume);
      onVolumeChange(0);
      setMuted(true);
    }
  };

  const activeTrack = TRACKS.find((t) => t.id === currentTrack);

  return (
    <>
      {/* Floating LP button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="BGM 플레이어"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 text-white shadow-lg shadow-ink-900/25 transition-all hover:scale-105 active:scale-95 dark:bg-white dark:text-ink-900"
      >
        <div
          className={`flex h-full w-full items-center justify-center rounded-full ${
            isPlaying ? 'animate-spin-slow' : ''
          }`}
        >
          {/* LP record */}
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-current">
            <div className="absolute inset-1 rounded-full border border-current opacity-30" />
            <div className="absolute inset-3 rounded-full border border-current opacity-20" />
            <div className="h-3.5 w-3.5 rounded-full bg-brand-500 dark:bg-brand-500" />
          </div>
        </div>
      </button>

      {/* Mini player popup */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed bottom-24 right-5 z-50 w-72 animate-slide-up overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-2xl dark:border-ink-800/70 dark:bg-ink-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-ink-800">
              <div className="flex items-center gap-2">
                <Music size={15} className="text-brand-500" />
                <span className="text-[13px] font-bold">독서 BGM</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-ink-800 dark:hover:text-ink-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Now playing */}
            {isPlaying && activeTrack ? (
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-lg animate-spin-slow">
                  {activeTrack.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold">
                    {activeTrack.title}
                  </p>
                  <p className="truncate text-[11px] text-ink-400">
                    {activeTrack.subtitle}
                  </p>
                </div>
                <button
                  onClick={onStop}
                  aria-label="정지"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-100 text-ink-700 transition-colors hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700"
                >
                  <Pause size={16} fill="currentColor" />
                </button>
              </div>
            ) : (
              <div className="px-4 py-3">
                <p className="text-[12px] text-ink-400">
                  테마를 선택하면 재생이 시작돼요
                </p>
              </div>
            )}

            {/* Track list */}
            <div className="space-y-1 px-3 pb-2">
              {TRACKS.map((track) => {
                const isActive = currentTrack === track.id && isPlaying;
                return (
                  <button
                    key={track.id}
                    onClick={() => onToggle(track.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-900/20'
                        : 'hover:bg-ink-50 dark:hover:bg-ink-800'
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base transition-colors ${
                        isActive
                          ? 'bg-brand-500 text-white'
                          : 'bg-ink-100 dark:bg-ink-800'
                      }`}
                    >
                      {isActive ? (
                        <Pause size={15} fill="currentColor" />
                      ) : (
                        <Play size={15} fill="currentColor" className="ml-0.5 text-ink-500 dark:text-ink-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-[13px] font-semibold ${
                          isActive ? 'text-brand-600 dark:text-brand-400' : ''
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="truncate text-[11px] text-ink-400">
                        {track.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Volume control */}
            <div className="flex items-center gap-3 border-t border-ink-100 px-4 py-3 dark:border-ink-800">
              <button
                onClick={handleMute}
                aria-label={muted ? '음소거 해제' : '음소거'}
                className="text-ink-400 transition-colors hover:text-ink-900 dark:hover:text-ink-100"
              >
                {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  onVolumeChange(v);
                  setMuted(v === 0);
                }}
                aria-label="볼륨"
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ink-200 accent-brand-500 dark:bg-ink-700"
              />
              <span className="w-8 text-right text-[11px] font-semibold text-ink-400">
                {Math.round((muted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
