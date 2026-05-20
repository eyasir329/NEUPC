/**
 * @file VideoPlayer component — handles video playback from different sources
 *   (Google Drive, YouTube, direct upload) with progress tracking.
 * @module VideoPlayer
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Loader2,
  AlertCircle,
  RefreshCw,
  PictureInPicture2,
} from 'lucide-react';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const VOLUME_KEY = 'neupc-video-volume';
const MUTED_KEY = 'neupc-video-muted';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

const TICK_MS = 30000;

// Module-level singleton — ensures a single Promise regardless of StrictMode double-invoke
// or multiple YouTubePlayer instances on the same page.
function extractYouTubeId(urlOrId) {
  if (!urlOrId) return '';
  const cleanId = String(urlOrId).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanId)) {
    return cleanId;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
  const match = cleanId.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  try {
    const url = new URL(cleanId);
    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtube-nocookie.com')) {
      const v = url.searchParams.get('v');
      if (v && v.length === 11) return v;
      const pathParts = url.pathname.split('/');
      for (let i = 0; i < pathParts.length; i++) {
        if (['embed', 'shorts', 'live', 'v'].includes(pathParts[i]) && pathParts[i + 1]?.length === 11) {
          return pathParts[i + 1];
        }
      }
    }
  } catch {}
  return cleanId;
}

let _ytApiPromise = null;
function loadYouTubeAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (_ytApiPromise) return _ytApiPromise;

  _ytApiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.onerror = () => {
        _ytApiPromise = null;
        reject(new Error('Failed to load YouTube API'));
      };
      document.head.appendChild(tag);
    } else {
      // Script tag exists, but window.YT.Player is not ready yet.
      // Poll for up to 10 seconds to wait for it.
      let attempts = 0;
      const interval = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(interval);
          resolve(window.YT);
        } else if (++attempts > 100) { // 10 seconds timeout
          clearInterval(interval);
          _ytApiPromise = null;
          reject(new Error('YouTube API load timeout'));
        }
      }, 100);
    }
  });

  return _ytApiPromise;
}

function YouTubePlayer({ videoId, onProgress, onComplete, initialPosition = 0 }) {
  const playerContainerRef = useRef(null); // stable div React renders; YT player mounts inside it
  const playerRef = useRef(null);          // YT.Player instance
  const containerRef = useRef(null);
  const hideControlsTimerRef = useRef(null);
  const cursorHideTimerRef = useRef(null);
  const scrubbingRef = useRef(false);
  const lastTapRef = useRef({ t: 0, side: null });
  const rafRef = useRef(null);
  const playingRef = useRef(false);
  const rateRef = useRef(1);
  const volumeRef = useRef(1);
  const progressTickRef = useRef(null);
  const lastTickRef = useRef({ time: null, at: null });
  const [retryCount, setRetryCount] = useState(0);

  const extractedId = extractYouTubeId(videoId);

  const [state, setState] = useState({
    playing: false,
    currentTime: initialPosition || 0,
    duration: 0,
    buffered: 0,
    volume: 1,
    muted: false,
    fullscreen: false,
    loading: true,
    showControls: true,
    rate: 1,
    settingsOpen: false,
    seekFlash: null,
    hoverTime: null,
    hoverX: 0,
    cursorHidden: false,
    ended: false,
    showResumeToast: initialPosition > 5,
    error: null,
  });

  // Controls visibility
  const showControlsTemporarily = useCallback(() => {
    setState((s) => ({ ...s, showControls: true, cursorHidden: false }));
    clearTimeout(hideControlsTimerRef.current);
    clearTimeout(cursorHideTimerRef.current);
    if (playingRef.current) {
      hideControlsTimerRef.current = setTimeout(() => {
        setState((s) => (s.settingsOpen ? s : { ...s, showControls: false }));
      }, 3000);
      cursorHideTimerRef.current = setTimeout(() => {
        setState((s) => (s.settingsOpen ? s : { ...s, cursorHidden: true }));
      }, 3500);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handler = () => showControlsTemporarily();
    container.addEventListener('mousemove', handler);
    container.addEventListener('pointermove', handler);
    return () => {
      clearTimeout(hideControlsTimerRef.current);
      clearTimeout(cursorHideTimerRef.current);
      container.removeEventListener('mousemove', handler);
      container.removeEventListener('pointermove', handler);
    };
  }, [showControlsTemporarily]);

  // Dismiss resume toast after 6s
  useEffect(() => {
    if (!state.showResumeToast) return;
    const t = setTimeout(() => setState((s) => ({ ...s, showResumeToast: false })), 6000);
    return () => clearTimeout(t);
  }, [state.showResumeToast]);

  // Fullscreen sync
  useEffect(() => {
    const onFsChange = () => {
      const fs = !!document.fullscreenElement || !!document.webkitFullscreenElement;
      setState((s) => ({ ...s, fullscreen: fs }));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  // Load YouTube IFrame API + create YT.Player
  useEffect(() => {
    if (!extractedId) {
      setState((s) => ({ ...s, loading: false, error: 'No YouTube video ID found.' }));
      return;
    }
    const container = playerContainerRef.current;
    if (!container) return;

    let player = null;
    let destroyed = false;
    let loadingTimer = null;

    // Create a fresh div for YT to replace with its iframe.
    const mountDiv = document.createElement('div');
    mountDiv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    container.appendChild(mountDiv);

    // Safety valve: if onReady never fires (e.g. blocked by CSP), clear the spinner.
    loadingTimer = setTimeout(() => {
      if (!destroyed) setState((s) => ({ ...s, loading: false }));
    }, 8000);

    loadYouTubeAPI().then((YT) => {
      if (destroyed) return;

      let savedVolume = 100, savedMuted = false;
      try {
        const v = parseFloat(localStorage.getItem(VOLUME_KEY));
        savedMuted = localStorage.getItem(MUTED_KEY) === '1';
        if (!isNaN(v) && v >= 0 && v <= 1) {
          savedVolume = Math.round(v * 100);
          volumeRef.current = v;
          setState((s) => ({ ...s, volume: v, muted: savedMuted }));
        }
      } catch {}

      try {
        player = new YT.Player(mountDiv, {
          videoId: extractedId,
          width: '100%',
          height: '100%',
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            origin: window.location.origin,
            ...(initialPosition > 5 ? { start: Math.floor(initialPosition) } : {}),
          },
          events: {
            onReady(e) {
              if (destroyed) return;
              clearTimeout(loadingTimer);
              e.target.setVolume(savedVolume);
              if (savedMuted) e.target.mute();
              playerRef.current = e.target;
              setState((s) => ({ ...s, loading: false, error: null }));
            },
            onStateChange(e) {
              if (destroyed) return;
              const yt = e.data;
              if (yt === 1) {
                playingRef.current = true;
                setState((s) => ({ ...s, playing: true, loading: false, ended: false }));
                showControlsTemporarily();
              } else if (yt === 2) {
                playingRef.current = false;
                setState((s) => ({ ...s, playing: false }));
                showControlsTemporarily();
              } else if (yt === 3) {
                setState((s) => ({ ...s, loading: true }));
              } else if (yt === 5 || yt === -1) {
                setState((s) => ({ ...s, loading: false }));
              } else if (yt === 0) {
                playingRef.current = false;
                setState((s) => ({ ...s, playing: false, ended: true, showControls: true }));
                onComplete?.();
              }
            },
            onPlaybackRateChange(e) {
              if (destroyed) return;
              rateRef.current = e.data;
              setState((s) => ({ ...s, rate: e.data }));
            },
            onError(e) {
              if (destroyed) return;
              clearTimeout(loadingTimer);
              const code = e.data;
              let msg = 'Failed to load YouTube video.';
              if (code === 2) msg = 'Invalid YouTube video ID or URL.';
              else if (code === 100) msg = 'YouTube video not found.';
              else if (code === 101 || code === 150) msg = 'This video cannot be played in embedded players.';
              setState((s) => ({ ...s, loading: false, error: msg }));
            },
          },
        });
      } catch {
        clearTimeout(loadingTimer);
        setState((s) => ({ ...s, loading: false, error: 'Failed to initialize YouTube player.' }));
      }
    }).catch(() => {
      if (destroyed) return;
      clearTimeout(loadingTimer);
      setState((s) => ({ ...s, loading: false, error: 'YouTube player blocked or failed to load API.' }));
    });

    return () => {
      destroyed = true;
      clearTimeout(loadingTimer);
      try { player?.destroy(); } catch {}
      playerRef.current = null;
      playingRef.current = false;
      if (mountDiv.parentNode === container) container.removeChild(mountDiv);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extractedId, retryCount]);

  // Poll YT.Player for currentTime, duration, buffered (API doesn't push these)
  useEffect(() => {
    const poll = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      try {
        const t = p.getCurrentTime?.() ?? 0;
        const dur = p.getDuration?.() ?? 0;
        const frac = p.getVideoLoadedFraction?.() ?? 0;
        setState((s) => ({
          ...s,
          currentTime: t,
          duration: dur > 0 ? dur : s.duration,
          buffered: dur > 0 ? frac * dur : s.buffered,
        }));
      } catch {}
    }, 250);
    return () => clearInterval(poll);
  }, []);

  const saveRef = useRef(null);

  // watch-time ticks
  useEffect(() => {
    const save = () => {
      if (!onProgress) return;
      const p = playerRef.current;
      if (!p) return;
      const now = Date.now();
      const prev = lastTickRef.current;
      let curr = 0;
      try { curr = p.getCurrentTime?.() ?? 0; } catch {}
      let delta = 0;
      if (prev.time != null && prev.at != null) {
        const wallDelta = (now - prev.at) / 1000;
        if (wallDelta < 1) return;
        delta = Math.max(0, Math.min(curr - prev.time, wallDelta, TICK_MS / 1000 + 2));
      }
      lastTickRef.current = { time: curr, at: now };
      if (delta > 0) {
        onProgress({
          deltaSeconds: delta,
          currentTime: curr > 0 ? curr : null,
          duration: p.getDuration?.() ?? 0
        });
      }
    };

    saveRef.current = save;

    if (state.playing && onProgress) {
      let curr = 0;
      try { curr = playerRef.current?.getCurrentTime?.() ?? 0; } catch {}
      lastTickRef.current = { time: curr, at: Date.now() };
      progressTickRef.current = setInterval(save, TICK_MS);
    } else {
      // Pause or completed: save remaining time immediately
      if (lastTickRef.current.time !== null) {
        save();
      }
      lastTickRef.current = { time: null, at: null };
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        save();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      // Unmount: save remaining time immediately
      if (lastTickRef.current.time !== null) {
        save();
      }
      clearInterval(progressTickRef.current);
      progressTickRef.current = null;
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [state.playing, onProgress]);

  // RAF loop for smooth progress bar between 250ms polls
  useEffect(() => {
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Controls — all use YT.Player methods directly (no postMessage)
  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playingRef.current) p.pauseVideo();
    else p.playVideo();
  }, []);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const isMuted = p.isMuted?.() ?? false;
    if (isMuted) p.unMute();
    else p.mute();
    try { localStorage.setItem(MUTED_KEY, isMuted ? '0' : '1'); } catch {}
    setState((s) => ({ ...s, muted: !isMuted }));
  }, []);

  const setVolume = useCallback((v) => {
    const p = playerRef.current;
    const clamped = Math.max(0, Math.min(1, v));
    volumeRef.current = clamped;
    p?.setVolume(Math.round(clamped * 100));
    if (clamped > 0) p?.unMute();
    try {
      localStorage.setItem(VOLUME_KEY, String(clamped));
      localStorage.setItem(MUTED_KEY, '0');
    } catch {}
    setState((s) => ({ ...s, volume: clamped, muted: clamped === 0 }));
  }, []);

  const seek = useCallback((seconds) => {
    const p = playerRef.current;
    if (!p) return;
    const curr = p.getCurrentTime?.() ?? 0;
    const dur = p.getDuration?.() ?? Infinity;
    const newTime = Math.max(0, Math.min(curr + seconds, dur));
    p.seekTo(newTime, true);
    setState((s) => ({ ...s, currentTime: newTime }));
  }, []);

  const seekToFraction = useCallback((fraction) => {
    const p = playerRef.current;
    if (!p) return;
    const dur = p.getDuration?.() ?? 0;
    if (!dur) return;
    const newTime = fraction * dur;
    p.seekTo(newTime, true);
    setState((s) => ({ ...s, currentTime: newTime }));
  }, []);

  const setRate = useCallback((rate) => {
    const p = playerRef.current;
    p?.setPlaybackRate(rate);
    rateRef.current = rate;
    setState((s) => ({ ...s, rate, settingsOpen: false }));
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const isFs = !!document.fullscreenElement || !!document.webkitFullscreenElement;
    if (isFs) {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    } else if (container.requestFullscreen) {
      container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
    }
  }, []);

  const replay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(0, true);
    p.playVideo();
    setState((s) => ({ ...s, ended: false, currentTime: 0 }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': case 'j': e.preventDefault(); seek(-10); break;
        case 'ArrowRight': case 'l': e.preventDefault(); seek(10); break;
        case 'ArrowUp': e.preventDefault(); setVolume(volumeRef.current + 0.05); break;
        case 'ArrowDown': e.preventDefault(); setVolume(volumeRef.current - 0.05); break;
        case 'm': e.preventDefault(); toggleMute(); break;
        case 'f': e.preventDefault(); toggleFullscreen(); break;
        case '>': e.preventDefault(); setRate(Math.min(2, rateRef.current + 0.25)); break;
        case '<': e.preventDefault(); setRate(Math.max(0.5, rateRef.current - 0.25)); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seek, toggleMute, toggleFullscreen, setRate, setVolume]);

  // Progress bar scrubbing
  const seekToClientX = useCallback((clientX, barEl) => {
    const p = playerRef.current;
    if (!p?.getDuration?.() || !barEl) return;
    const rect = barEl.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    seekToFraction(pos);
  }, [seekToFraction]);

  const handleProgressPointerDown = useCallback((e) => {
    e.stopPropagation();
    scrubbingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    seekToClientX(e.clientX, e.currentTarget);
  }, [seekToClientX]);

  const handleProgressPointerMove = useCallback((e) => {
    if (!scrubbingRef.current) return;
    seekToClientX(e.clientX, e.currentTarget);
    const dur = playerRef.current?.getDuration?.() ?? 0;
    if (!dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setState((s) => ({ ...s, hoverTime: pos * dur, hoverX: pos * rect.width }));
  }, [seekToClientX]);

  const handleProgressPointerUp = useCallback((e) => {
    scrubbingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const handleProgressHover = useCallback((e) => {
    const dur = playerRef.current?.getDuration?.() ?? 0;
    if (!dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setState((s) => ({ ...s, hoverTime: pos * dur, hoverX: pos * rect.width }));
  }, []);

  const handleProgressLeave = useCallback(() => {
    setState((s) => ({ ...s, hoverTime: null }));
  }, []);

  // Video surface click: double-tap = seek ±10s, single = toggle play / show controls
  const handleSurfaceClick = useCallback((e) => {
    const isCoarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
    const rect = e.currentTarget.getBoundingClientRect();
    const side = (e.clientX - rect.left) < rect.width / 2 ? 'left' : 'right';
    const now = Date.now();
    const last = lastTapRef.current;
    if (now - last.t < 300 && last.side === side) {
      seek(side === 'left' ? -10 : 10);
      setState((s) => ({ ...s, seekFlash: side }));
      setTimeout(() => setState((s) => ({ ...s, seekFlash: null })), 400);
      lastTapRef.current = { t: 0, side: null };
      return;
    }
    lastTapRef.current = { t: now, side };
    if (isCoarse) {
      if (!state.showControls) showControlsTemporarily();
      else togglePlay();
    } else {
      togglePlay();
    }
  }, [state.showControls, showControlsTemporarily, togglePlay, seek]);

  if (state.error) {
    return (
      <div className="relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-gray-900 border border-white/10">
        <AlertCircle className="mb-3 h-10 w-10 text-red-500" />
        <p className="mb-4 text-[13px] text-gray-400 px-6 text-center">{state.error}</p>
        <button
          onClick={() => {
            _ytApiPromise = null;
            setState((s) => ({ ...s, error: null, loading: true }));
            setRetryCount((c) => c + 1);
          }}
          className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  const VolumeIcon = state.muted || state.volume === 0 ? VolumeX : state.volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={containerRef}
      className={`group relative aspect-video max-h-[85vh] w-full overflow-hidden rounded-xl bg-black select-none ${
        state.cursorHidden && state.playing ? 'cursor-none' : ''
      }`}
    >
      {/* Stable container — YT player is mounted imperatively inside via useEffect */}
      <div ref={playerContainerRef} className="absolute inset-0 h-full w-full" />

      {/* Click-capture overlay over the video area (above the YT iframe) */}
      <div
        className="absolute inset-x-0 top-0 bottom-20 z-10"
        onClick={handleSurfaceClick}
      />

      {/* Loading overlay */}
      {state.loading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/50">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      )}

      {/* Resume toast */}
      {state.showResumeToast && (
        <div className="absolute top-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-black/80 px-3 py-2 text-xs text-white shadow-lg backdrop-blur-md sm:text-sm">
          <span>Resuming from {formatTime(initialPosition)}</span>
          <button
            onClick={() => {
              playerRef.current?.seekTo(0, true);
              setState((s) => ({ ...s, showResumeToast: false, currentTime: 0 }));
            }}
            className="rounded bg-white/15 px-2 py-0.5 hover:bg-white/25"
          >
            Start over
          </button>
          <button
            onClick={() => setState((s) => ({ ...s, showResumeToast: false }))}
            aria-label="Dismiss"
            className="rounded px-1 text-white/70 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Replay overlay */}
      {state.ended && !state.loading && (
        <button
          onClick={replay}
          aria-label="Replay"
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 text-white"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <RefreshCw className="h-7 w-7" />
          </div>
          <span className="mt-3 text-sm">Replay</span>
        </button>
      )}

      {/* Double-tap seek flash */}
      {state.seekFlash && (
        <div
          className={`pointer-events-none absolute inset-y-0 z-10 ${state.seekFlash === 'left' ? 'left-0' : 'right-0'} flex w-1/2 items-center justify-center bg-white/10`}
        >
          <div className="flex flex-col items-center text-white">
            {state.seekFlash === 'left' ? <SkipBack className="h-10 w-10" /> : <SkipForward className="h-10 w-10" />}
            <span className="mt-1 text-xs">10s</span>
          </div>
        </div>
      )}

      {/* Play overlay when paused */}
      {!state.playing && !state.loading && !state.ended && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/30">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm sm:h-16 sm:w-16">
            <Play className="h-7 w-7 fill-current text-white sm:h-8 sm:w-8" />
          </div>
        </div>
      )}

      {/* Mini progress bar when controls hidden */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-white/10 transition-opacity ${
          state.showControls || !state.playing || state.settingsOpen ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div
          className="h-full bg-emerald-500 transition-[width] duration-150 ease-linear"
          style={{ width: `${state.duration ? (state.currentTime / state.duration) * 100 : 0}%` }}
        />
      </div>

      {/* Controls bar */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/80 to-transparent px-3 pt-14 pb-3 transition-opacity sm:px-4 sm:pt-16 sm:pb-4 ${
          state.showControls || !state.playing || state.settingsOpen
            ? 'opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      >
        {/* Progress bar */}
        <div
          className="group/bar relative mb-3 flex h-5 cursor-pointer touch-none items-center"
          onPointerDown={handleProgressPointerDown}
          onPointerMove={handleProgressPointerMove}
          onPointerUp={handleProgressPointerUp}
          onPointerCancel={handleProgressPointerUp}
          onMouseMove={handleProgressHover}
          onMouseLeave={handleProgressLeave}
        >
          {state.hoverTime !== null && (
            <div
              className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded bg-black/90 px-2 py-0.5 font-mono text-[10px] text-white tabular-nums sm:text-xs"
              style={{ left: `${state.hoverX}px` }}
            >
              {formatTime(state.hoverTime)}
            </div>
          )}
          <div className="relative h-1 w-full rounded-full bg-white/20 transition-[height] group-hover/bar:h-1.5">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/30"
              style={{ width: `${state.duration ? (state.buffered / state.duration) * 100 : 0}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
              style={{ width: `${state.duration ? (state.currentTime / state.duration) * 100 : 0}%` }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg sm:h-3 sm:w-3"
              style={{ left: `${state.duration ? (state.currentTime / state.duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={togglePlay}
            aria-label={state.playing ? 'Pause' : 'Play'}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 sm:h-9 sm:w-9"
          >
            {state.playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
          </button>

          <button
            onClick={() => seek(-10)}
            aria-label="Rewind 10 seconds"
            className="hidden h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 min-[480px]:flex sm:h-9 sm:w-9"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            onClick={() => seek(10)}
            aria-label="Forward 10 seconds"
            className="hidden h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 min-[480px]:flex sm:h-9 sm:w-9"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          {/* Volume cluster */}
          <div className="group/vol flex items-center">
            <button
              onClick={toggleMute}
              aria-label={state.muted ? 'Unmute' : 'Mute'}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 sm:h-9 sm:w-9"
            >
              <VolumeIcon className="h-4 w-4" />
            </button>
            <div className="hidden overflow-hidden transition-[width] duration-200 sm:block sm:w-0 sm:group-hover/vol:w-24">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.muted ? 0 : state.volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                aria-label="Volume"
                className="ml-2 h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/30 accent-white"
              />
            </div>
          </div>

          <span className="ml-0.5 font-mono text-[11px] text-white/80 tabular-nums sm:ml-1 sm:text-xs">
            {formatTime(state.currentTime)} / {formatTime(state.duration)}
          </span>

          <div className="flex-1" />

          {/* Playback speed */}
          <div className="relative">
            <button
              onClick={() => setState((s) => ({ ...s, settingsOpen: !s.settingsOpen }))}
              aria-label="Settings"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 sm:h-9 sm:w-9"
            >
              <Settings className="h-4 w-4" />
            </button>
            {state.settingsOpen && (
              <div className="absolute right-0 bottom-12 z-10 w-40 overflow-hidden rounded-lg border border-white/10 bg-black/90 backdrop-blur-md">
                <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  Playback speed
                </div>
                {PLAYBACK_RATES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRate(r)}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-xs text-white hover:bg-white/10 ${state.rate === r ? 'bg-white/5' : ''}`}
                  >
                    <span>{r === 1 ? 'Normal' : `${r}x`}</span>
                    {state.rate === r && <span className="text-emerald-400">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleFullscreen}
            aria-label={state.fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 sm:h-9 sm:w-9"
          >
            {state.fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function DriveVideoPlayer({
  lessonId,
  fileId,
  initialPosition,
  onProgress,
  onComplete,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const hideControlsTimerRef = useRef(null);
  const scrubbingRef = useRef(false);
  const lastTimeUpdateRef = useRef(0);
  const stallTimerRef = useRef(null);
  const lastTapRef = useRef({ t: 0, side: null });
  const initialSeekedRef = useRef(false);
  const errorRetryRef = useRef(0);
  const cursorHideTimerRef = useRef(null);

  const [pipSupported, setPipSupported] = useState(false);

  const [state, setState] = useState({
    playing: false,
    currentTime: initialPosition || 0,
    duration: 0,
    buffered: 0,
    volume: 1,
    muted: false,
    fullscreen: false,
    pip: false,
    loading: true,
    error: null,
    showControls: true,
    rate: 1,
    settingsOpen: false,
    seekFlash: null,
    hoverTime: null,
    hoverX: 0,
    cursorHidden: false,
    ended: false,
    showResumeToast: initialPosition > 5,
  });

  const videoSrc = `/api/video/${lessonId}${fileId ? `?fileId=${fileId}` : ''}`;

  const showControlsTemporarily = useCallback(() => {
    setState((s) => ({ ...s, showControls: true, cursorHidden: false }));
    clearTimeout(hideControlsTimerRef.current);
    clearTimeout(cursorHideTimerRef.current);
    const video = videoRef.current;
    if (video && !video.paused) {
      hideControlsTimerRef.current = setTimeout(() => {
        setState((s) => (s.settingsOpen ? s : { ...s, showControls: false }));
      }, 3000);
      cursorHideTimerRef.current = setTimeout(() => {
        setState((s) => (s.settingsOpen ? s : { ...s, cursorHidden: true }));
      }, 3500);
    }
  }, []);

  // PIP support — detect on client to avoid SSR hydration mismatch
  useEffect(() => {
    setPipSupported(!!document.pictureInPictureEnabled);
  }, []);

  // Auto-dismiss resume toast
  useEffect(() => {
    if (!state.showResumeToast) return;
    const t = setTimeout(
      () => setState((s) => ({ ...s, showResumeToast: false })),
      6000
    );
    return () => clearTimeout(t);
  }, [state.showResumeToast]);

  // Restore stored volume
  useEffect(() => {
    try {
      const v = parseFloat(localStorage.getItem(VOLUME_KEY));
      const m = localStorage.getItem(MUTED_KEY) === '1';
      const video = videoRef.current;
      if (video) {
        if (!isNaN(v) && v >= 0 && v <= 1) video.volume = v;
        video.muted = m;
        setState((s) => ({ ...s, volume: video.volume, muted: video.muted }));
      }
    } catch {}
  }, []);

  // Hide controls after inactivity
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handler = () => showControlsTemporarily();
    container.addEventListener('mousemove', handler);
    container.addEventListener('pointermove', handler);
    return () => {
      clearTimeout(hideControlsTimerRef.current);
      container.removeEventListener('mousemove', handler);
      container.removeEventListener('pointermove', handler);
    };
  }, [showControlsTemporarily]);

  // Sync fullscreen state
  useEffect(() => {
    const onFsChange = () => {
      const fs =
        !!document.fullscreenElement || !!document.webkitFullscreenElement;
      setState((s) => ({ ...s, fullscreen: fs }));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  // Progress save: 30s interval + on tab hide.
  // deltaSeconds = real playback advanced since last save, clamped to [0, TICK]
  // so seeks/scrubs don't inflate watch time.
  const saveRef = useRef(null);
  const lastTickRef = useRef({ time: null, at: null });

  // Progress save: 30s interval + on tab hide.
  // deltaSeconds = real playback advanced since last save, clamped to [0, TICK]
  // so seeks/scrubs don't inflate watch time.
  useEffect(() => {
    const save = () => {
      const video = videoRef.current;
      if (!video || !onProgress) return;
      const now = Date.now();
      const prev = lastTickRef.current;
      let delta = 0;
      if (prev.time != null && prev.at != null) {
        const playDelta = video.currentTime - prev.time;
        const wallDelta = (now - prev.at) / 1000;
        // Coalesce ticks closer than 1s (e.g. interval + visibility race).
        if (wallDelta < 1) return;
        delta = Math.max(0, Math.min(playDelta, wallDelta, TICK_MS / 1000 + 2));
      }
      lastTickRef.current = { time: video.currentTime, at: now };
      onProgress({
        currentTime: video.currentTime > 0 ? video.currentTime : null,
        duration: video.duration,
        deltaSeconds: delta,
      });
    };

    saveRef.current = save;

    if (state.playing && onProgress) {
      lastTickRef.current = {
        time: videoRef.current?.currentTime ?? 0,
        at: Date.now(),
      };
      progressTimerRef.current = setInterval(save, TICK_MS);
    } else {
      // Pause or completed: save remaining time immediately
      if (lastTickRef.current.time !== null) {
        save();
      }
      lastTickRef.current = { time: null, at: null };
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        save();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      // Unmount: save remaining time immediately
      if (lastTickRef.current.time !== null) {
        save();
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [state.playing, onProgress]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    try { localStorage.setItem(MUTED_KEY, video.muted ? '1' : '0'); } catch {}
    setState((s) => ({ ...s, muted: video.muted }));
  }, []);

  const setVolume = useCallback((v) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(1, v));
    video.volume = clamped;
    if (clamped > 0 && video.muted) video.muted = false;
    try {
      localStorage.setItem(VOLUME_KEY, String(clamped));
      localStorage.setItem(MUTED_KEY, video.muted ? '1' : '0');
    } catch {}
    setState((s) => ({ ...s, volume: clamped, muted: video.muted }));
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;
    const isFs =
      !!document.fullscreenElement || !!document.webkitFullscreenElement;
    if (isFs) {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(
        document
      );
      return;
    }
    if (container.requestFullscreen) container.requestFullscreen();
    else if (container.webkitRequestFullscreen)
      container.webkitRequestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
  }, []);

  const togglePip = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch {}
  }, []);

  const setRate = useCallback((rate) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setState((s) => ({ ...s, rate, settingsOpen: false }));
  }, []);

  const seek = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(
      0,
      Math.min(video.currentTime + seconds, video.duration || Infinity)
    );
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        !videoRef.current
      ) {
        return;
      }
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
        case 'j':
          e.preventDefault();
          seek(-10);
          break;
        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          seek(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((videoRef.current.volume || 0) + 0.05);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((videoRef.current.volume || 0) - 0.05);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'p':
          e.preventDefault();
          togglePip();
          break;
        case '>':
          e.preventDefault();
          setRate(Math.min(2, (videoRef.current.playbackRate || 1) + 0.25));
          break;
        case '<':
          e.preventDefault();
          setRate(Math.max(0.5, (videoRef.current.playbackRate || 1) - 0.25));
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seek, toggleMute, toggleFullscreen, togglePip, setRate, setVolume]);

  const seekToClientX = useCallback((clientX, barEl) => {
    const video = videoRef.current;
    if (!video || !video.duration || !barEl) return;
    const rect = barEl.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    video.currentTime = pos * video.duration;
    setState((s) => ({ ...s, currentTime: pos * video.duration }));
  }, []);

  const handleProgressPointerDown = useCallback(
    (e) => {
      const bar = e.currentTarget;
      scrubbingRef.current = true;
      bar.setPointerCapture?.(e.pointerId);
      seekToClientX(e.clientX, bar);
    },
    [seekToClientX]
  );

  const handleProgressPointerMove = useCallback(
    (e) => {
      if (!scrubbingRef.current) return;
      seekToClientX(e.clientX, e.currentTarget);
    },
    [seekToClientX]
  );

  const handleProgressPointerUp = useCallback((e) => {
    scrubbingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const handleProgressHover = useCallback((e) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setState((s) => ({
      ...s,
      hoverTime: pos * video.duration,
      hoverX: pos * rect.width,
    }));
  }, []);

  const handleProgressLeave = useCallback(() => {
    setState((s) => ({ ...s, hoverTime: null }));
  }, []);

  const replay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
    setState((s) => ({ ...s, ended: false }));
  }, []);

  const dismissResumeToast = useCallback(() => {
    setState((s) => ({ ...s, showResumeToast: false }));
  }, []);

  const restartFromBeginning = useCallback(() => {
    const video = videoRef.current;
    if (video) video.currentTime = 0;
    setState((s) => ({ ...s, showResumeToast: false }));
  }, []);

  // Tap handler: double-tap left/right = seek; single = toggle play / show controls
  const handleSurfaceClick = useCallback(
    (e) => {
      const isCoarse =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(pointer: coarse)').matches;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const side = x < rect.width / 2 ? 'left' : 'right';
      const now = Date.now();
      const last = lastTapRef.current;
      if (now - last.t < 300 && last.side === side) {
        // Double tap → seek
        seek(side === 'left' ? -10 : 10);
        setState((s) => ({ ...s, seekFlash: side }));
        setTimeout(() => setState((s) => ({ ...s, seekFlash: null })), 400);
        lastTapRef.current = { t: 0, side: null };
        return;
      }
      lastTapRef.current = { t: now, side };
      if (isCoarse) {
        if (!state.showControls) showControlsTemporarily();
        else togglePlay();
      } else {
        togglePlay();
      }
    },
    [state.showControls, showControlsTemporarily, togglePlay, seek]
  );

  // Stall recovery: if stuck waiting >6s, nudge currentTime to force buffer reload
  useEffect(() => {
    return () => {
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    };
  }, []);

  const handleVideoEvents = {
    onLoadedMetadata: (e) => {
      setState((s) => ({
        ...s,
        duration: e.target.duration,
        loading: false,
      }));
      // Set initial position once metadata available
      if (!initialSeekedRef.current && initialPosition > 0) {
        e.target.currentTime = initialPosition;
        initialSeekedRef.current = true;
      }
    },
    onTimeUpdate: (e) => {
      // Throttle: 4Hz max
      const now = performance.now();
      if (now - lastTimeUpdateRef.current < 250) return;
      lastTimeUpdateRef.current = now;
      setState((s) => ({ ...s, currentTime: e.target.currentTime }));
    },
    onProgress: (e) => {
      const video = e.target;
      if (video.buffered.length > 0) {
        // Find buffered range covering current time
        let bufferedEnd = 0;
        for (let i = 0; i < video.buffered.length; i++) {
          if (
            video.currentTime >= video.buffered.start(i) &&
            video.currentTime <= video.buffered.end(i)
          ) {
            bufferedEnd = video.buffered.end(i);
            break;
          }
        }
        if (bufferedEnd === 0)
          bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setState((s) => ({ ...s, buffered: bufferedEnd }));
      }
    },
    onPlay: () => setState((s) => ({ ...s, playing: true })),
    onPause: () => setState((s) => ({ ...s, playing: false })),
    onEnded: () => {
      setState((s) => ({ ...s, playing: false, ended: true, showControls: true }));
      onComplete?.();
    },
    onError: (e) => {
      const code = e.target?.error?.code;
      const isNetwork = code === 2;
      // Auto-retry transient network errors with exp backoff: 1s, 2s, 4s
      if (isNetwork && errorRetryRef.current < 3) {
        const delay = 1000 * Math.pow(2, errorRetryRef.current);
        errorRetryRef.current += 1;
        setTimeout(() => {
          const v = videoRef.current;
          if (v) {
            try { v.load(); v.play().catch(() => {}); } catch {}
          }
        }, delay);
        setState((s) => ({ ...s, loading: true }));
        return;
      }
      fetch(videoSrc, { method: 'GET', headers: { Range: 'bytes=0-0' } })
        .then(async (r) => {
          if (r.ok || r.status === 206) return `Playback failed (code ${code ?? '?'}).`;
          let msg = `Server ${r.status}`;
          try { const j = await r.json(); if (j?.error) msg = `${msg}: ${j.error}`; } catch {}
          return msg;
        })
        .catch(() => isNetwork ? 'Network error while loading video.' : 'Failed to load video. Please try again.')
        .then((errorMsg) => setState((s) => ({ ...s, loading: false, error: errorMsg })));
    },
    onWaiting: (e) => {
      setState((s) => ({ ...s, loading: true }));
      // Schedule stall recovery
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
      const video = e.target;
      stallTimerRef.current = setTimeout(() => {
        if (video && video.readyState < 3 && !video.paused) {
          // Nudge by tiny amount to force a fresh range request
          try {
            const t = video.currentTime;
            video.currentTime = Math.max(0, t - 0.1);
          } catch {}
        }
      }, 6000);
    },
    onCanPlay: () => {
      if (stallTimerRef.current) {
        clearTimeout(stallTimerRef.current);
        stallTimerRef.current = null;
      }
      errorRetryRef.current = 0;
      setState((s) => ({ ...s, loading: false }));
    },
    onPlaying: () =>
      setState((s) => ({ ...s, loading: false, ended: false })),
    onVolumeChange: (e) => {
      setState((s) => ({
        ...s,
        volume: e.target.volume,
        muted: e.target.muted,
      }));
    },
    onRateChange: (e) =>
      setState((s) => ({ ...s, rate: e.target.playbackRate })),
    onEnterPictureInPicture: () => setState((s) => ({ ...s, pip: true })),
    onLeavePictureInPicture: () => setState((s) => ({ ...s, pip: false })),
  };

  if (state.error) {
    return (
      <div className="relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-gray-900">
        <AlertCircle className="mb-3 h-10 w-10 text-red-500" />
        <p className="mb-4 text-sm text-gray-400">{state.error}</p>
        <button
          onClick={() => {
            setState((s) => ({ ...s, error: null, loading: true }));
            videoRef.current?.load();
          }}
          className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  const VolumeIcon = state.muted || state.volume === 0
    ? VolumeX
    : state.volume < 0.5
      ? Volume1
      : Volume2;

  return (
    <div
      ref={containerRef}
      className={`group relative aspect-video max-h-[85vh] w-full overflow-hidden rounded-xl bg-black select-none ${
        state.cursorHidden && state.playing ? 'cursor-none' : ''
      }`}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        className="h-full w-full"
        preload="auto"
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        controlsList="nodownload"
        disablePictureInPicture={false}
        onClick={handleSurfaceClick}
        {...handleVideoEvents}
      />

      {/* Loading overlay — hide if buffer ahead exists (transient stutter) */}
      {state.loading &&
        !(
          state.buffered > state.currentTime + 0.5 && state.playing
        ) && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
        )}

      {/* Resume toast */}
      {state.showResumeToast && (
        <div className="absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-black/80 px-3 py-2 text-xs text-white shadow-lg backdrop-blur-md sm:text-sm">
          <span>Resuming from {formatTime(initialPosition)}</span>
          <button
            onClick={restartFromBeginning}
            className="rounded bg-white/15 px-2 py-0.5 hover:bg-white/25"
          >
            Start over
          </button>
          <button
            onClick={dismissResumeToast}
            aria-label="Dismiss"
            className="rounded px-1 text-white/70 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Replay overlay when ended */}
      {state.ended && !state.loading && (
        <button
          onClick={replay}
          aria-label="Replay"
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 text-white"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <RefreshCw className="h-7 w-7" />
          </div>
          <span className="mt-3 text-sm">Replay</span>
        </button>
      )}

      {/* Double-tap seek flash */}
      {state.seekFlash && (
        <div
          className={`pointer-events-none absolute inset-y-0 ${state.seekFlash === 'left' ? 'left-0' : 'right-0'} flex w-1/2 items-center justify-center bg-white/10`}
        >
          <div className="flex flex-col items-center text-white">
            {state.seekFlash === 'left' ? (
              <SkipBack className="h-10 w-10" />
            ) : (
              <SkipForward className="h-10 w-10" />
            )}
            <span className="mt-1 text-xs">10s</span>
          </div>
        </div>
      )}

      {/* Play overlay */}
      {!state.playing && !state.loading && (
        <button
          onClick={togglePlay}
          aria-label="Play"
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity group-hover:opacity-100"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm sm:h-16 sm:w-16">
            <Play className="h-7 w-7 fill-current text-white sm:h-8 sm:w-8" />
          </div>
        </button>
      )}

      {/* Mini progress bar — visible when controls hidden */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-white/10 transition-opacity ${
          state.showControls || !state.playing || state.settingsOpen
            ? 'opacity-0'
            : 'opacity-100'
        }`}
      >
        <div
          className="h-full bg-emerald-500 transition-[width] duration-150 ease-linear"
          style={{
            width: `${state.duration ? (state.currentTime / state.duration) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Controls */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-3 pt-14 pb-3 transition-opacity sm:px-4 sm:pt-16 sm:pb-4 ${
          state.showControls || !state.playing || state.settingsOpen
            ? 'opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      >
        {/* Progress bar */}
        <div
          className="group/bar relative mb-3 flex h-5 cursor-pointer touch-none items-center"
          onPointerDown={handleProgressPointerDown}
          onPointerMove={(e) => {
            handleProgressPointerMove(e);
            handleProgressHover(e);
          }}
          onPointerUp={handleProgressPointerUp}
          onPointerCancel={handleProgressPointerUp}
          onMouseMove={handleProgressHover}
          onMouseLeave={handleProgressLeave}
        >
          {/* Hover time tooltip */}
          {state.hoverTime !== null && (
            <div
              className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded bg-black/90 px-2 py-0.5 font-mono text-[10px] text-white tabular-nums sm:text-xs"
              style={{ left: `${state.hoverX}px` }}
            >
              {formatTime(state.hoverTime)}
            </div>
          )}
          <div className="relative h-1 w-full rounded-full bg-white/20 transition-[height] group-hover/bar:h-1.5">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/30"
              style={{
                width: `${state.duration ? (state.buffered / state.duration) * 100 : 0}%`,
              }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
              style={{
                width: `${state.duration ? (state.currentTime / state.duration) * 100 : 0}%`,
              }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg sm:h-3 sm:w-3"
              style={{
                left: `${state.duration ? (state.currentTime / state.duration) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={togglePlay}
            aria-label={state.playing ? 'Pause' : 'Play'}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 sm:h-9 sm:w-9"
          >
            {state.playing ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current" />
            )}
          </button>

          <button
            onClick={() => seek(-10)}
            aria-label="Rewind 10 seconds"
            className="hidden h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 min-[480px]:flex sm:h-9 sm:w-9"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            onClick={() => seek(10)}
            aria-label="Forward 10 seconds"
            className="hidden h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 min-[480px]:flex sm:h-9 sm:w-9"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          {/* Volume cluster */}
          <div className="group/vol flex items-center">
            <button
              onClick={toggleMute}
              aria-label={state.muted ? 'Unmute' : 'Mute'}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 sm:h-9 sm:w-9"
            >
              <VolumeIcon className="h-4 w-4" />
            </button>
            <div className="hidden overflow-hidden transition-[width] duration-200 sm:block sm:w-0 sm:group-hover/vol:w-24">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.muted ? 0 : state.volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                aria-label="Volume"
                className="ml-2 h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/30 accent-white"
              />
            </div>
          </div>

          <span className="ml-0.5 font-mono text-[11px] text-white/80 tabular-nums sm:ml-1 sm:text-xs">
            {formatTime(state.currentTime)} / {formatTime(state.duration)}
          </span>

          <div className="flex-1" />

          {/* Settings (playback speed) */}
          <div className="relative">
            <button
              onClick={() =>
                setState((s) => ({ ...s, settingsOpen: !s.settingsOpen }))
              }
              aria-label="Settings"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 sm:h-9 sm:w-9"
            >
              <Settings className="h-4 w-4" />
            </button>
            {state.settingsOpen && (
              <div className="absolute right-0 bottom-12 z-10 w-40 overflow-hidden rounded-lg border border-white/10 bg-black/90 backdrop-blur-md">
                <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  Playback speed
                </div>
                {PLAYBACK_RATES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRate(r)}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-xs text-white hover:bg-white/10 ${
                      state.rate === r ? 'bg-white/5' : ''
                    }`}
                  >
                    <span>{r === 1 ? 'Normal' : `${r}x`}</span>
                    {state.rate === r && (
                      <span className="text-emerald-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PIP */}
          {pipSupported && (
            <button
              onClick={togglePip}
              aria-label="Picture in picture"
              className="hidden h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 sm:flex sm:h-9 sm:w-9"
            >
              <PictureInPicture2 className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            aria-label={state.fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 sm:h-9 sm:w-9"
          >
            {state.fullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VideoPlayer({
  lesson,
  initialPosition = 0,
  onProgress,
  onComplete,
}) {
  const { video_source, video_id, video_url, id: lessonId } = lesson;

  if (video_source === 'none' || (!video_id && !video_url)) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-gray-900">
        <div className="text-center">
          <Play className="mx-auto mb-3 h-12 w-12 text-gray-700" />
          <p className="text-sm text-gray-500">
            This lesson doesn't have a video
          </p>
        </div>
      </div>
    );
  }

  if (video_source === 'youtube') {
    return <YouTubePlayer videoId={video_id || video_url} initialPosition={initialPosition} onProgress={onProgress} onComplete={onComplete} />;
  }

  if (video_source === 'drive' || video_source === 'upload') {
    return (
      <DriveVideoPlayer
        lessonId={lessonId}
        fileId={video_id}
        initialPosition={initialPosition}
        onProgress={onProgress}
        onComplete={onComplete}
      />
    );
  }

  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-gray-900">
      <div className="text-center">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-yellow-500" />
        <p className="text-sm text-gray-400">
          Unsupported video source: {video_source}
        </p>
      </div>
    </div>
  );
}
