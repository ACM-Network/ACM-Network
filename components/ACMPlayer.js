// components/ACMPlayer.js
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

/**
 * ACMPlayer
 * Props:
 *  - src (string): stream url (m3u8 or mp4)
 *  - onClose (function): called when user clicks Close
 */
export default function ACMPlayer({ src, onClose }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [audioTracks, setAudioTracks] = useState([]);
  const [selectedAudio, setSelectedAudio] = useState(-1);
  const [qualities, setQualities] = useState([]); // -1 (auto) or levels
  const [selectedQuality, setSelectedQuality] = useState(-1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPiP, setIsPiP] = useState(false);
  const [error, setError] = useState('');

  // initialize HLS or native source
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;

    // cleanup previous
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch (e) {}
      hlsRef.current = null;
    }

    setBuffering(true);
    setIsPlaying(false);
    setError('');
    setAudioTracks([]);
    setQualities([]);
    setSelectedAudio(-1);
    setSelectedQuality(-1);

    const isM3u8 = String(src).toLowerCase().includes('.m3u8');
    const canPlayNative = v.canPlayType('application/vnd.apple.mpegurl') !== '';

    if (isM3u8 && Hls.isSupported() && !canPlayNative) {
      const hls = new Hls({
        // tuned for low-latency / minimal buffer
        maxBufferLength: 6,
        maxMaxBufferLength: 30,
        backBufferLength: 10,
        lowLatencyMode: true,
        enableWorker: true,
        xhrSetup: function (xhr, url) {
          // place to add auth headers if needed in future
        },
      });
      hlsRef.current = hls;

      hls.on(Hls.Events.ERROR, (evt, data) => {
        console.error('HLS error', data);
        if (data && data.fatal) {
          setError('Playback error — check console for details.');
          try { hls.destroy(); } catch (e) {}
        }
      });

      // manifest parsed -> levels available
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setBuffering(false);
        // detect audio tracks & qualities
        const audio = (hls.audioTracks || []).map((t, i) => ({ name: t.name || `Track ${i}`, lang: t.lang, index: i }));
        setAudioTracks(audio);
        const levels = (hls.levels || []).map((l, i) => ({
          index: i,
          height: l.height,
          bitrate: l.bitrate,
          name: l.name || (l.height ? `${l.height}p` : `${Math.round(l.bitrate/1000)}kbps`)
        }));
        // add auto option (-1)
        setQualities([{ index: -1, name: 'Auto' }, ...levels]);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, () => {
        setSelectedQuality(hls.currentLevel);
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (evt, data) => {
        const audio = (data && data.audioTracks) ? data.audioTracks.map((t, i) => ({ name: t.name || `Track ${i}`, lang: t.lang, index: i })) : [];
        setAudioTracks(audio);
      });

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, () => {
        setSelectedAudio(hls.audioTrack);
      });

      hls.on(Hls.Events.BUFFER_STALLED, () => setBuffering(true));
      hls.on(Hls.Events.BUFFER_APPENDED, () => setBuffering(false));
      hls.loadSource(src);
      hls.attachMedia(v);
      // don't auto-start play here; user gesture will call play
    } else {
      // native HLS (Safari) or mp4
      v.src = src;
      v.load();
    }

    // video listeners
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setTime(v.currentTime);
    const onDuration = () => setDuration(v.duration || 0);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);

    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onDuration);
    v.addEventListener('waiting', onWaiting);
    v.addEventListener('playing', onPlaying);

    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onDuration);
      v.removeEventListener('waiting', onWaiting);
      v.removeEventListener('playing', onPlaying);
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch (e) {}
        hlsRef.current = null;
      }
    };
  }, [src]);

  // keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      const v = videoRef.current;
      if (!v) return;
      if (e.code === 'Space') { e.preventDefault(); v.paused ? v.play() : v.pause(); }
      if (e.code === 'ArrowRight') { v.currentTime = Math.min((v.duration || 0), v.currentTime + 10); }
      if (e.code === 'ArrowLeft') { v.currentTime = Math.max(0, v.currentTime - 10); }
      if (e.code === 'ArrowUp') { v.volume = Math.min(1, (v.volume || 1) + 0.1); setVolume(v.volume); }
      if (e.code === 'ArrowDown') { v.volume = Math.max(0, (v.volume || 1) - 0.1); setVolume(v.volume); }
      if (e.key === 'f') { toggleFullscreen(); }
      if (e.key === 'p') { togglePiP(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function playUserGesture() {
    // called when user clicks the big Play overlay or Play button — ensures browsers allow playback
    const v = videoRef.current;
    if (!v) return;
    v.play().catch((err) => console.warn('play error', err));
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch((e) => console.warn(e)); else v.pause();
  }

  function seekTo(val) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min((v.duration || 0), val));
  }

  function setVol(val) {
    const v = videoRef.current;
    if (!v) return;
    const clamped = Math.max(0, Math.min(1, val));
    v.volume = clamped;
    setVolume(clamped);
    setMuted(clamped === 0);
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function pickAudio(idx) {
    try {
      if (hlsRef.current) {
        hlsRef.current.audioTrack = idx;
        setSelectedAudio(idx);
      } else if (videoRef.current && videoRef.current.audioTracks) {
        for (let i = 0; i < videoRef.current.audioTracks.length; i++) {
          videoRef.current.audioTracks[i].enabled = i === idx;
        }
        setSelectedAudio(idx);
      }
    } catch (e) {
      console.error('pickAudio', e);
    }
  }

  function pickQuality(qIdx) {
    try {
      if (!hlsRef.current) return;
      // qIdx === -1 -> auto
      hlsRef.current.currentLevel = qIdx;
      setSelectedQuality(qIdx);
    } catch (e) {
      console.error('pickQuality', e);
    }
  }

  function changePlaybackRate(r) {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = r;
    setPlaybackRate(r);
  }

  async function togglePiP() {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (!document.pictureInPictureElement) {
        await v.requestPictureInPicture();
        setIsPiP(true);
      } else {
        await document.exitPictureInPicture();
        setIsPiP(false);
      }
    } catch (e) {
      console.warn('PiP not available', e);
    }
  }

  function toggleFullscreen() {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch((e) => console.warn(e));
    } else {
      document.exitFullscreen?.();
    }
  }

  function takeScreenshot() {
    try {
      const v = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'acm-screenshot.png';
      a.click();
    } catch (e) {
      console.warn('screenshot failed', e);
    }
  }

  // Format time helper
  function fmt(t) {
    if (!t || !isFinite(t)) return '0:00';
    const sec = Math.floor(t % 60).toString().padStart(2, '0');
    const min = Math.floor((t / 60) % 60).toString();
    const hr = Math.floor(t / 3600);
    return hr ? `${hr}:${min.padStart(2,'0')}:${sec}` : `${min}:${sec}`;
  }

  return (
    <div className="acm-player-shell" aria-label="ACM Player">
      <div className="player-top">
        <div className="player-title">ACM Player</div>
        <div className="player-actions">
          <button className="btn" onClick={toggleFullscreen} title="Fullscreen (F)">⤢</button>
          <button className="btn" onClick={togglePiP} title="Picture in Picture (P)">⧉</button>
          <button className="btn" onClick={takeScreenshot} title="Screenshot">📷</button>
          <button className="btn" onClick={() => { if (onClose) onClose(); }}>Close</button>
        </div>
      </div>

      <div className="player-stage">
        <video ref={videoRef} className="acm-video" playsInline crossOrigin="anonymous" />
        {/* large center play overlay (user gesture) */}
        {!isPlaying && (
          <button
            className="acm-center-play"
            aria-label="Play"
            onClick={() => { playUserGesture(); }}
          >
            ▶
          </button>
        )}
        {buffering && <div className="buffer-indicator">Buffering…</div>}
      </div>

      <div className="player-controls">
        <button className="control-btn" onClick={togglePlay}>{isPlaying ? '❚❚' : '▶'}</button>

        <div className="time">
          <small>{fmt(time)}</small>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={time}
            onChange={(e) => seekTo(Number(e.target.value))}
            step="0.1"
          />
          <small>{fmt(duration)}</small>
        </div>

        <div className="volume-area">
          <button className="control-btn" onClick={toggleMute}>{muted ? 'Unmute' : 'Mute'}</button>
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVol(Number(e.target.value))} />
        </div>

        <div className="audio-select">
          <label>Audio</label>
          <select value={selectedAudio} onChange={(e) => pickAudio(Number(e.target.value))}>
            <option value={-1}>Default</option>
            {audioTracks.map((t) => (<option key={t.index} value={t.index}>{t.name}{t.lang ? ` (${t.lang})` : ''}</option>))}
          </select>
        </div>

        <div className="quality-select">
          <label>Quality</label>
          <select value={selectedQuality} onChange={(e) => pickQuality(Number(e.target.value))}>
            {qualities.map((q) => (<option key={q.index} value={q.index}>{q.name}</option>))}
          </select>
        </div>

        <div className="speed-select">
          <label>Speed</label>
          <select value={playbackRate} onChange={(e) => changePlaybackRate(Number(e.target.value))}>
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => <option key={r} value={r}>{r}x</option>)}
          </select>
        </div>
      </div>

      {error && <div className="player-error">{error}</div>}
    </div>
  );
  }
