// File: src/LiveTV.jsx import React, { useState } from "react"; import Hls from "hls.js";

const channels = [ { name: "News 24", url: "https://your-link-1.m3u8", thumbnail: "https://via.placeholder.com/300x200.png?text=News+24", }, { name: "Sports Hub", url: "https://your-link-2.m3u8", thumbnail: "https://via.placeholder.com/300x200.png?text=Sports+Hub", }, { name: "Movie Max", url: "https://your-link-3.m3u8", thumbnail: "https://via.placeholder.com/300x200.png?text=Movie+Max", }, ];

const VideoPlayer = ({ streamUrl, onClose }) => { const videoRef = React.useRef(null);

React.useEffect(() => { if (Hls.isSupported()) { const hls = new Hls(); hls.loadSource(streamUrl); hls.attachMedia(videoRef.current); } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) { videoRef.current.src = streamUrl; } }, [streamUrl]);

return ( <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"> <div className="relative w-full max-w-4xl"> <video
ref={videoRef}
controls
autoPlay
className="w-full h-auto rounded-2xl shadow-lg"
/> <button
onClick={onClose}
className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
> Close </button> </div> </div> ); };

export default function LiveTV() { const [selectedChannel, setSelectedChannel] = useState(null);

return ( <div className="min-h-screen bg-gray-900 text-white p-6"> <h1 className="text-4xl font-bold mb-8 text-center">ACM Network</h1> <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"> {channels.map((channel) => ( <div key={channel.name} onClick={() => setSelectedChannel(channel)} className="cursor-pointer hover:scale-105 transition-transform duration-300 shadow-xl bg-gray-800 rounded-xl overflow-hidden" > <img
src={channel.thumbnail}
alt={channel.name}
className="w-full h-48 object-cover"
/> <div className="p-4"> <h2 className="text-xl font-semibold text-center">{channel.name}</h2> </div> </div> ))} </div> {selectedChannel && ( <VideoPlayer streamUrl={selectedChannel.url} onClose={() => setSelectedChannel(null)} /> )} </div> ); }
