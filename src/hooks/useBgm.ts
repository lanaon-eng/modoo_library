import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioEngine, type TrackId } from '@/lib/audioEngine';

export function useBgm() {
  const engineRef = useRef<AudioEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<TrackId | null>(null);
  const [volume, setVolumeState] = useState(0.5);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
    }
    return engineRef.current;
  }, []);

  const play = useCallback(
    (track: TrackId) => {
      const engine = getEngine();
      engine.play(track);
      setIsPlaying(true);
      setCurrentTrack(track);
    },
    [getEngine]
  );

  const stop = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      engine.stop();
    }
    setIsPlaying(false);
    setCurrentTrack(null);
  }, []);

  const toggle = useCallback(
    (track: TrackId) => {
      if (isPlaying && currentTrack === track) {
        stop();
      } else {
        play(track);
      }
    },
    [isPlaying, currentTrack, play, stop]
  );

  const setVolume = useCallback(
    (v: number) => {
      setVolumeState(v);
      const engine = engineRef.current;
      if (engine) engine.setVolume(v);
    },
    []
  );

  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  return { isPlaying, currentTrack, volume, play, stop, toggle, setVolume };
}
