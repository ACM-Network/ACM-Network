// pages/index.js // ACM Network — single-file Next.js page (paste into pages/index.js in a Next.js + Tailwind project) // FEATURES: // - 'Cult classic' landing page that asks for a stream link on open // - Custom-built "ACM Player" (not using a third-party visible player UI) // - HLS support via hls.js with audio-track selection (multi-audio) // - Minimal buffering tweaks in hls config (cannot guarantee "zero buffer") // REQUIREMENTS: // 1) Next.js project (13+). 2) Tailwind CSS configured. 3) Install hls.js: npm install hls.js

import { useEffect, useRef, useState } from 'react' import Hls from 'hls.js'

export default function Home() { const [url, setUrl] = useState('') const [submittedUrl, setSubmittedUrl] = useState('') const [error, setError] = useState('') const [isPlaying, setIsPlaying] = useState(false) const [duration, setDuration] = useState(0) const [currentTime, setCurrentTime] = useState(0) const [muted, setMuted] = useState(false) const [volume, setVolume] = useState(1) const [audioTracks, setAudioTracks] = useState([]) const [selectedAudio, setSelectedAudio] = useState(-1) const [isBuffering, setIsBuffering] = useState(false)

const videoRef = useRef(null) const hlsRef = useRef(null)

useEffect(() => { return () => { destroyHls() } // eslint-disable-next-line react-hooks/exhaustive-deps }, [])

function destroyHls() { try { if (hlsRef.current) { hlsRef.current.destroy() hlsRef.current = null } } catch (e) { // ignore } }

function attachStreamToPlayer(streamUrl) { setError('') setAudioTracks([]) setSelectedAudio(-1) destroyHls()

const video = videoRef.current
if (!video) return setError('Player not ready')

// Reset video element
video.pause()
video.removeAttribute('src')
video.load()

const isHlsNative = video.canPlayType('application/vnd.apple.mpegurl') !== ''
const isM3U8 = streamUrl.trim().toLowerCase().includes('.m3u8')

if (isM3U8 && !isHlsNative) {
  // Use hls.js
  const hls = new Hls({
    // small tweaks to reduce buffering — cannot guarantee zero buffer
    maxBufferLength: 30, // seconds of buffer
    maxMaxBufferLength: 60,
    enableWorker: true,
    xhrSetup: function (xhr, url) {
      // You can set headers here if using a signed URL / token
    },
  })

  hlsRef.current = hls

  hls.on(Hls.Events.ERROR, (event, data) => {
    console.error('HLS error', event, data)
    if (data && data.fatal) {
      setError('Playback error: ' + (data.type || 'fatal'))
      try {
        hls.destroy()
      } catch (e) {}
    }
  })

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    // Auto-play when manifest parsed
    video.play().catch(() => {})
  })

  hls.on(Hls.Events.BUFFER_STALLED, () => setIsBuffering(true))
  hls.on(Hls.Events.BUFFER_APPENDED, () => setIsBuffering(false))

  hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (evt, data) => {
    const tracks = (data && data.audioTracks) || []
    setAudioTracks(tracks.map((t, i) => ({ name: t.name || `Track ${i}`, lang: t.lang, index: i })))
  })

  hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (evt, data) => {
    const idx = hls.audioTrack
    setSelectedAudio(idx)
  })

  hls.loadSource(streamUrl)
  hls.attachMedia(video)

  // attempt quick start
  hls.startLoad()
} else {
  // For MP4 or native HLS (Safari), just set src
  video.src = streamUrl
  video.play().catch((e) => {
    // Autoplay might be blocked
  })

  // If native HLS on Safari, some players expose audioTracks on video element
  try {
    const tracks = video.audioTracks
    if (tracks && tracks.length) {
      const arr = []
      for (let i = 0; i < tracks.length; i++) {
        arr.push({ name: tracks[i].label || `Track ${i}`, lang: tracks[i].language, index: i })
      }
      setAudioTracks(arr)
    }
  } catch (e) {}
}

// set handlers
video.onplay = () => setIsPlaying(true)
video.onpause = () => setIsPlaying(false)
video.ontimeupdate = () => setCurrentTime(video.currentTime)
video.onloadedmetadata = () => setDuration(video.duration || 0)
video.onwaiting = () => setIsBuffering(true)
video.onplaying = () => setIsBuffering(false)

}

function handleSubmit(e) { e?.preventDefault() if (!url.trim()) return setError('Please provide a stream URL') setSubmittedUrl(url.trim()) attachStreamToPlayer(url.trim()) }

function togglePlay() { const v = videoRef.current if (!v) return if (v.paused) { v.play().catch(() => {}) } else { v.pause() } }

function seekTo(frac) { if (!videoRef.current) return const t = Math.max(0, Math.min(duration || 0, frac)) videoRef.current.currentTime = t }

function changeVolume(val) { const v = Math.max(0, Math.min(1, val)) setVolume(v) if (videoRef.current) videoRef.current.volume = v setMuted(v === 0) }

function selectAudioTrack(idx) { try { if (hlsRef.current) { hlsRef.current.audioTrack = idx setSelectedAudio(idx) } else if (videoRef.current && videoRef.current.audioTracks) { // native audioTracks (limited support) for (let i = 0; i < videoRef.current.audioTracks.length; i++) { videoRef.current.audioTracks[i].enabled = i === idx } setSelectedAudio(idx) } } catch (e) { console.error('selectAudioTrack error', e) } }

return ( <div className="min-h-screen bg-gradient-to-b from-[#0b0f12] via-[#081826] to-[#0b0610] text-slate-100 font-sans"> {/* Cult classic intro / header */} <header className="max-w-6xl mx-auto py-12 px-6 text-center"> <div className="inline-block rounded-3xl px-6 py-3 bg-black/60 backdrop-blur-md border border-white/8 shadow-2xl"> <h1 className="text-5xl font-extrabold tracking-tight leading-none" style={{ fontFamily: 'Georgia, serif' }}>ACM Network</h1> <p className="mt-2 text-slate-300 italic">Cult Classic — press play on nostalgia</p> </div> </header>

<main className="max-w-5xl mx-auto px-6">
    {/* Stream input or player area */}
    {!submittedUrl ? (
      <form onSubmit={handleSubmit} className="bg-gradient-to-t from-black/60 to-transparent p-8 rounded-2xl border border-white/6 shadow-xl">
        <h2 className="text-2xl font-bold mb-2">Paste your stream link</h2>
        <p className="text-sm text-slate-400 mb-4">ACM Player can play HLS (.m3u8) and standard MP4 URLs. Paste a stream below and press Open.</p>
        <div className="flex gap-3">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://.../stream.m3u8 or https://.../video.mp4" className="flex-1 bg-slate-900/60 p-3 rounded-lg border border-white/6 focus:outline-none" />
          <button type="submit" className="px-4 py-3 bg-amber-500 rounded-lg font-semibold text-black">Open</button>
        </div>
        {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
        <div className="mt-4 text-xs text-slate-500">Tip: For multi-audio tracks use an HLS stream that contains multiple audio renditions. ACM Player will list available audio tracks automatically.</div>
      </form>
    ) : (
      <section className="bg-gradient-to-t from-black/60 to-transparent p-4 rounded-2xl border border-white/6 shadow-xl">
        <div className="relative rounded-lg overflow-hidden bg-black">
          <video ref={videoRef} className="w-full h-[520px] bg-black object-cover" playsInline controls={false} />

          {/* Overlay controls */}
          <div className="absolute left-4 bottom-4 right-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-xl p-2">
              <button onClick={togglePlay} className="px-3 py-2 rounded-md bg-white/6 hover:bg-white/10">
                {isPlaying ? 'Pause' : 'Play'}
              </button>

              <div className="flex items-center gap-2">
                <div className="text-xs text-slate-300">{formatTime(currentTime)}</div>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="w-72"
                />
                <div className="text-xs text-slate-300">{formatTime(duration)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-xl p-2">
              <div className="flex items-center gap-2">
                <button onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted }} className="px-2 py-1 rounded">{muted ? 'Unmute' : 'Mute'}</button>
                <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => changeVolume(Number(e.target.value))} />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-300">Audio:</label>
                <select value={selectedAudio} onChange={(e) => selectAudioTrack(Number(e.target.value))} className="bg-transparent">
                  <option value={-1}>Default</option>
                  {audioTracks.map((t) => (
                    <option key={t.index} value={t.index}>{t.name || `Track ${t.index}`}{t.lang ? ` (${t.lang})` : ''}</option>
                  ))}
                </select>
              </div>

              <button onClick={() => { setSubmittedUrl(''); destroyHls(); }} className="px-3 py-1 rounded bg-white/6">Close</button>
            </div>
          </div>

          {/* Buffer indicator */}
          {isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/60 rounded-full px-4 py-2 text-sm">Buffering…</div>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
          <div>Streaming: {submittedUrl}</div>
          <div>{audioTracks.length > 0 ? `${audioTracks.length} audio track(s)` : 'Audio tracks: auto-detecting'}</div>
        </div>

      </section>
    )}

    <div className="mt-10 text-center text-slate-500 text-xs">ACM Network — Cult Classic UI · ACM Player</div>
  </main>

  {/* small helper */}
  <style jsx global>{`
    body { background-color: #04050a }
  `}</style>
</div>

) }

function formatTime(t) { if (!t || isNaN(t) || t === Infinity) return '0:00' const sec = Math.floor(t % 60) const min = Math.floor((t / 60) % 60) const hr = Math.floor(t / 3600) return (hr ? hr + ':' : '') + ${min.toString().padStart(hr ? 2 : 1, '0')}:${sec.toString().padStart(2, '0')} }

// Deploy notes (copy-paste): // 1) Make sure you npm install hls.js and Tailwind is set up in the project. // 2) This UI expects HLS (.m3u8) streams for multi-audio support. If you use DASH or other formats, add an appropriate library (dash.js) and similar track handling. // 3) "Zero buffering" is not technically guaranteed: buffering depends on the stream origin, CDN, network, and players. The code uses hls.js with conservative buffer settings to reduce initial buffering. // 4) If you need token-authenticated streams (signed URLs), integrate token fetching in xhrSetup or route the request through your server. // 5) Want styling tweaks (classic VHS, CRT glow, or retro serif)? Tell me the exact vibe and I will adjust colors, fonts, and animations.

