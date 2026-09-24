import { useEffect, useRef, useCallback } from 'react';
import './AnalysisOrbit.css';

const VIDEOS = [
  { src: '/media/videos/anteriorview-video-analysis.mp4', label: 'Anterior' },
  { src: '/media/videos/rightview-video-analysis.mp4', label: 'Right Lateral' },
  { src: '/media/videos/posteriorview-video-analysis.mp4', label: 'Posterior' },
  { src: '/media/videos/leftview-video-analysis.mp4', label: 'Left Lateral' },
];

const ROTATION_DURATION = 32;
const DEG_PER_MS = 360 / (ROTATION_DURATION * 1000);
const STAGGER_MS = 800; // delay between each video start

export function AnalysisOrbit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const setVideoRef = useCallback((el: HTMLVideoElement | null, i: number) => {
    videoRefs.current[i] = el;
  }, []);

  // Staggered video start — reverse order so back videos start first
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const count = videoRefs.current.length;
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      const reverseIndex = count - 1 - i;
      const timer = setTimeout(() => {
        video.play().catch(() => {});
      }, reverseIndex * STAGGER_MS);
      timers.push(timer);
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  // rAF rotation
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    let rafId: number;
    let angle = 0;
    let lastTime = 0;

    const tick = (now: number) => {
      if (lastTime === 0) lastTime = now;
      const dt = Math.min(now - lastTime, 32);
      lastTime = now;
      angle = (angle + DEG_PER_MS * dt) % 360;
      scene.style.transform = `rotateY(${angle}deg)`;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div ref={containerRef} className="orbit-wrapper">
      <div className="orbit-center">
        <div className="orbit-center__ring orbit-center__ring--outer" />
        <div className="orbit-center__ring orbit-center__ring--inner" />
        <div className="orbit-center__dot" />
      </div>

      <div ref={sceneRef} className="orbit-scene">
        {VIDEOS.map((video, i) => {
          const angle = (360 / VIDEOS.length) * i;
          return (
            <div
              key={video.label}
              className="orbit-card"
              style={{ transform: `rotateY(${angle}deg) translateZ(var(--orbit-radius))` }}
            >
              <div className="orbit-card__inner">
                <video
                  ref={(el) => setVideoRef(el, i)}
                  src={video.src}
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="orbit-card__video"
                />
                <div className="orbit-card__scanline" />
                <div className="orbit-card__label">{video.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
