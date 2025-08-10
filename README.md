# ACM Network — Cult Classic Streaming Frontend

## What this is
ACM Network with ACM Player — custom HLS player using hls.js, supports multi-audio selection from a single HLS stream, cult-classic styling.

## How to deploy
1. Create a GitHub repository named `ACM-Network` (or push into your existing repo).
2. Add the files above exactly in their folders.
3. Commit and push to `main`.
4. Go to https://vercel.com -> Import Project -> Connect to GitHub -> choose the repo -> Deploy (defaults work).
5. After deploy, open your site. Paste an HLS `.m3u8` stream URL into the input and press **Open in ACM Player**.

## Notes
- Multi-audio relies on HLS with audio renditions inside the same manifest. If your stream has separate audio groups, hls.js will detect them and list them.
- "Zero buffering" cannot be guaranteed — buffering depends on the CDN and network. The code uses small buffer settings and `lowLatencyMode` to reduce buffering.
- If your stream requires auth headers or signed tokens, route the request via your server or set xhrSetup in hls.js (`components/ACMPlayer.js`).
