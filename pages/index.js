import { useState, useRef, useEffect } from "react";
import Hls from "hls.js";

export default function Home() {
  const [introDone, setIntroDone] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");
  const [playStream, setPlayStream] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (playStream && videoRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.current.src = streamUrl;
      }
    }
  }, [playStream, streamUrl]);

  return (
    <div className="container">
      {!introDone && (
        <div className="intro" onClick={() => setIntroDone(true)}>
          <h1 className="glitch" data-text="ACM Network">ACM Network</h1>
          <p className="click">Click to Enter</p>
        </div>
      )}

      {introDone && !playStream && (
        <div className="modal">
          <h2>Enter Stream Link</h2>
          <input
            type="text"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            placeholder="Paste your stream URL here..."
          />
          <button onClick={() => setPlayStream(true)}>Play</button>
        </div>
      )}

      {playStream && (
        <div className="player-container">
          <video ref={videoRef} controls className="acm-player" />
        </div>
      )}
    </div>
  );
}
