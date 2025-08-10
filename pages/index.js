// ACM Network — Simple HLS Player

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function Home() {
  const [url, setUrl] = useState('');
  const [submittedUrl, setSubmittedUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioTracks, setAudioTracks] = useState([]);
  const [selectedAudio, setSelectedAudio] = useState(-1);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    if (submittedUrl && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsRef.current = hls;

      hls.loadSource(submittedUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setAudioTracks(data.audioTracks);
      });

      return () => hls.destroy();
    } else if (submittedUrl) {
      videoRef.current.src = submittedUrl;
    }
  }, [submittedUrl]);

  const changeAudioTrack = (trackId) => {
    setSelectedAudio(trackId);
    if (hlsRef.current) {
      hlsRef.current.audioTrack = trackId;
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px', background: '#000', color: '#fff', minHeight: '100vh' }}>
      {!isPlaying ? (
        <div>
          <h1 style={{ fontSize: '2rem' }}>🎬 ACM Network</h1>
          <input
            type="text"
            value={url}
            placeholder="Paste stream link..."
            onChange={(e) => setUrl(e.target.value)}
            style={{ width: '300px', padding: '10px' }}
          />
          <button
            onClick={() => { setSubmittedUrl(url); setIsPlaying(true); }}
            style={{ marginLeft: '10px', padding: '10px' }}
          >
            ▶ Play
          </button>
        </div>
      ) : (
        <div>
          <video ref={videoRef} controls autoPlay style={{ width: '80%', borderRadius: '8px', marginTop: '20px' }} />
          {audioTracks.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <label>Select Audio Track: </label>
              <select
                value={selectedAudio}
                onChange={(e) => changeAudioTrack(parseInt(e.target.value))}
              >
                {audioTracks.map((track, i) => (
                  <option key={i} value={i}>{track.name || `Track ${i+1}`}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
