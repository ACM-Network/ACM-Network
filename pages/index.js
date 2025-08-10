// pages/index.js
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const ACMPlayer = dynamic(() => import('../components/ACMPlayer'), { ssr: false });

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [streamLink, setStreamLink] = useState('');
  const [openedStream, setOpenedStream] = useState('');
  const [showPlayer, setShowPlayer] = useState(false);

  // Keep the same intro timing as before
  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 2500);
    return () => clearTimeout(t);
  }, []);

  function openStream() {
    const url = streamLink.trim();
    if (!url) {
      alert('Paste a stream URL (mp4 or .m3u8).');
      return;
    }
    setOpenedStream(url);
    setShowPlayer(true);
    // allow DOM to render player before attaching
    setTimeout(() => {
      // nothing here — ACMPlayer handles attaching HLS and play on user gesture
    }, 50);
  }

  function closePlayer() {
    setShowPlayer(false);
    setOpenedStream('');
  }

  return (
    <div className="site-root">
      <header className="hero">
        <div className="hero-inner">
          <h1 className="acm-title">ACM Network</h1>
          <p className="acm-sub">Cult Classic • Stream Anything</p>
        </div>
      </header>

      {showIntro && (
        <div className="intro-overlay">
          <div className="intro-text">
            <div className="glitch" data-text="ACM NETWORK">ACM NETWORK</div>
            <div className="sub">Cult Classic</div>
          </div>
        </div>
      )}

      {!showPlayer && (
        <main className="center-card">
          <div className="glass">
            <h2>Paste your stream link</h2>
            <input
              type="text"
              value={streamLink}
              onChange={(e) => setStreamLink(e.target.value)}
              placeholder="https://.../stream.m3u8  or https://.../video.mp4"
            />
            <div className="row">
              <button className="primary" onClick={openStream}>Open in ACM Player</button>
              <button className="ghost" onClick={() => setStreamLink('')}>Clear</button>
            </div>
            <p className="hint">ACM Player supports HLS (.m3u8) with multi-audio. Use HLS from a fast CDN for best results.</p>
          </div>
        </main>
      )}

      {showPlayer && (
        <section className="player-section">
          <ACMPlayer src={openedStream} onClose={closePlayer} />
        </section>
      )}

      <footer className="site-footer">
        © {new Date().getFullYear()} ACM Network — Cult Classic Player (ACM Player)
      </footer>
    </div>
  );
        }
