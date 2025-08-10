import { useState } from "react";
import Head from "next/head";
import Hls from "hls.js";

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [showPlayer, setShowPlayer] = useState(false);

  const handlePlay = () => {
    if (!videoUrl.trim()) return;

    setShowPlayer(true);

    setTimeout(() => {
      const video = document.getElementById("video");
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 10,
          liveSyncDuration: 1,
        });
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = videoUrl;
      }
    }, 0);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <Head>
        <title>Toonix TV</title>
        <meta name="description" content="Watch Toonix TV live streaming" />
      </Head>

      <h1 style={{ color: "#ff9900" }}>Toonix TV</h1>

      <input
        type="text"
        placeholder="Enter .m3u8 link"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        style={{
          width: "70%",
          padding: "10px",
          marginBottom: "10px",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
      />
      <br />
      <button
        onClick={handlePlay}
        style={{
          padding: "10px 20px",
          backgroundColor: "#ff9900",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Play
      </button>

      {showPlayer && (
        <div style={{ marginTop: "20px" }}>
          <video
            id="video"
            controls
            autoPlay
            style={{ width: "80%", borderRadius: "10px" }}
          ></video>
        </div>
      )}
    </div>
  );
}
