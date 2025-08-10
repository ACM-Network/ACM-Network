// components/ACMPlayer.js
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function ACMPlayer({ src, onClose }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [audioTracks, setAudioTracks] = useState([]);
  const [selectedAudio, setSelectedAudio] = useState(-1);
  const [error, setError] = useState('');

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;

    // Clean up previous
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch (e) {}
      hlsRef.current = null;
    }

    // If HLS and browser doesn't natively support, use hls.js
    const isM3U8 = src.toLowerCase().includes('.m3u8');
    const canPlayNativeHls = v.canPlayType('application/vnd.apple.mpegurl') !== '';

    if (isM3U8 && Hls.isSupported() && !canPlayNativeHls) {
      const hls = new Hls({
        // buffer settings to reduce initial buffering — tweak as needed
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        backBufferLength: 15,
        lowLatencyMode: true,
        enableWorker: true,
      });
      hlsRef.current = hls;

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error', data);
        if (data && data.fatal) {
          setError('Playback error. See console for details.');
          try { hls.destroy(); } catch (e) {}
        }
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // play automatically if user gesture available
        v.play().catch(() => {});
      });

      hls.on(Hls.Events.BUFFER_STALLED, () => setIsBuffering(true));
      hls.on(Hls.Events.BUFFER_APPENDED, () => setIsBuffering(false));
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (evt, data) => {
        const tracks = (data && data.audioTracks) || [];
        setAudioTracks(tracks.map((t, i) => ({ name: t.name || `Track ${i}`, lang: t.lang, index: i })));
      });
      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, () => {
        setSelectedAudio(hls.audioTrack);
      });

      hls.loadSource(src);
      hls.attachMedia(v);
      hls.startLoad();
    } else {
      // Native support or non-HLS (mp4)
      v.src = src;
      v.load();
      v.play().catch(() => {});
      // collect native audioTracks (limited browser support)
      try {
        const tracks = v.audioTracks || [];
        if (tracks && tracks.length) {
          const arr = [];
          for (let i = 0; i < tracks.length; i++) {
            arr.push({ name: tracks[i].label || `Track ${i}`, lang: tracks[i].language, index: i });
          }
          setAudioTracks(arr);
        }
      } catch (e) {}
    }

    // Attach basic listeners
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setCurrentTime(v.currentTime);
    const onLoaded = () => setDuration(v.duration || 0);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);

    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('waiting', onWaiting);
    v.addEventListener('playing', onPlaying);

    return () => {
      // cleanup
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('waiting', onWaiting);
      v.removeEventListener('playing', onPlaying);
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch (e) {}
        hlsRef.current = null;
      }
    };
  }, [src]);

  // Controls
  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }

  function seek(val) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min((duration || 0), val));
  }

  function changeVolume(val) {
    const v = videoRef.current;
    if (!v) return;
    const vol = Math.max(0, Math.min(1, val));
    setVolume(vol);
    v.volume = vol;
    setMuted(vol === 0);
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
        // native audio tracks
        for (let i = 0; i < videoRef.current.audioTracks.length; i++) {
          videoRef.current.audioTracks[i].enabled = i === idx;
        }
        setSelectedAudio(idx);
      }
    } catch (e) {
      console.error('audio select error', e);
    }
  }

  return (
    <div className="acm-player-shell">
      <div className="player-top">
        <div className="player-title">ACM Player</div>
        <div className="player-actions">
          <button className="btn" onClick={() => { if (onClose) onClose(); }}>
            Close
          </button>
        </div>
      </div>

      <div className="player-stage">
        <video
          ref={videoRef}
          className="acm-video"
          playsInline
          controls={false}
          crossOrigin="anonymous"
        />
        {isBuffering && <div className="buffer-indicator">Buffering…</div>}
      </div>

      <div className="player-controls">
        <button className="control-btn" onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>

        <div className="time">
          <small>{formatTime(currentTime)}</small>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            step="0.1"
          />
          <small>{formatTime(duration)}</small>
        </div>

        <div className="volume-area">
          <button className="control-btn" onClick={toggleMute}>{muted ? 'Unmute' : 'Mute'}</button>
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => changeVolume(Number(e.target.value))} />
        </div>

        <div className="audio-select">
          <label>Audio:</label>
          <select value={selectedAudio} onChange={(e) => pickAudio(Number(e.target.value))}>
            <option value={-1}>Default</option>
            {audioTracks.map((t) => (
              <option key={t.index} value={t.index}>
                {t.name || `Track ${t.index + 1}`}{t.lang ? ` (${t.lang})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="player-error">{error}</div>}
    </div>
  );
}

function formatTime(t) {
  if (!t || isNaN(t) || !isFinite(t)) return '0:00';
  const sec = Math.floor(t % 60).toString().padStart(2, '0');
  const min = Math.floor((t / 60) % 60);
  const hr = Math.floor(t / 3600);
  if (hr) return `${hr}:${min.toString().padStart(2, '0')}:${sec}`;
  return `${min}:${sec}`;
}
