// pages/index.js
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const ACMPlayer = dynamic(() => import('../components/ACMPlayer'), { ssr: false });

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [streamLink, setStreamLink] = useState('');
  const [openedStream, setOpenedStream] = useState('');
  const [showPlayer, setShowPlayer] = useState(false);

  // Auto-hide intro after 2.5s
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
    // Scroll to player on small screens
    setTimeout(() => {
      const el = document.querySelector('.acm-player-shell');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  }

  function closePlayer() {
    setShowPlayer(false);
    setOpenedStream('');
  }

  return (
    <div className="site-root">
      {/* Cult-classic header */}
      <header className="hero">
        <div className="hero-inner">
          <h1 className="acm-title">ACM Network</h1>
          <p className="acm-sub">Cult Classic • Stream Anything</p>
        </div>
      </header>

      {/* Intro overlay */}
      {showIntro && (
        <div className="intro-overlay">
          <div className="intro-text">
            <div className="glitch" data-text="ACM NETWORK">ACM NETWORK</div>
            <div className="sub">Cult Classic</div>
          </div>
        </div>
      )}

      {/* Stream input modal */}
      {!showPlayer && (
        <main className="center-card">
          <div className="glass">
            <h2>Paste your stream link</h2>
            <input
              type="text"
              placeholder="https://.../stream.m3u8  or https://.../video.mp4"
              value={streamLink}
              onChange={(e) => setStreamLink(e.target.value)}
            />
            <div className="row">
              <button className="primary" onClick={openStream}>Open in ACM Player</button>
              <button className="ghost" onClick={() => { setStreamLink(''); }}>Clear</button>
            </div>
            <p className="hint">ACM Player supports HLS (.m3u8) with multi-audio. For best results use HLS from a fast CDN.</p>
          </div>
        </main>
      )}

      {/* Player section */}
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
