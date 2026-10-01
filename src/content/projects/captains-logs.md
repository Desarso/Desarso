---
title: Captain's Logs
summary: A self-hosted video journal. Recording works offline, uploads resume on their own, and every log lands in my Immich library with adaptive streaming and a transcript.
standfirst: A self-hosted video journal. Recording works offline, uploads survive dropped connections and resume on their own, and every log ends up in my own photo library with adaptive streaming and an automatic transcript.
category: Apps I use
year: 2025–2026
status: In use
stack: [React, TypeScript, IndexedDB, Go, FFmpeg, HLS, Immich, Expo]
cover: /projects/captains-logs/cover.webp
coverAlt: Captain's Logs library and recording screens
order: 5
endTitle: Recorded daily, never shown
endText: Captain's Logs runs on my own server and is in daily use. The content is private by design, so everything on this page uses test patterns and placeholder entries. The repos are private.
---
A video journal only works if recording is never the thing that fails. If the upload can drop a log, or the app needs a good connection, I stop using it. Captain's Logs is built around that rule. Every few seconds of video is saved on the device before anything touches the network. Uploads drain in the background and retry with backoff. The server repairs whatever the browser produced, encodes it for streaming, transcribes it, and files it into my self-hosted [Immich](https://immich.app) library, where it sits next to my photos without cluttering the main timeline.

![Library](/projects/captains-logs/library-mobile.webp#phone) ![Recording](/projects/captains-logs/recording-active-mobile.webp#phone) ![Upload queue while offline](/projects/captains-logs/uploads-retry-mobile.webp#phone "The library, a recording in progress, and the upload queue holding a fresh log while the server is unreachable. Test patterns and placeholder entries only.")

## The pieces

- **Web app (PWA).** React and Vite. Records with `MediaRecorder` at 1080p, 1440p or 4K, uploads while recording, and has a library with search, lazy thumbnails, an HLS player and per-log transcripts. It installs as an app on the phone.
- **Go backend.** Fiber, with no database: all state is JSON and media files on disk. It receives chunks, rebuilds them into a clean WebM with FFmpeg, encodes an HLS ladder, transcribes with Whisper, and links the result into an Immich album.
- **Mobile app.** An Expo prototype that records or picks a video and uploads it through a resumable session API on the same backend.

```text
MediaRecorder ─► IndexedDB (every chunk, one transaction)
                    │ drain loop, backoff 2s → 60s
                    ▼
              Go API ─► repair ─► WebM ─► HLS 360/720/1080 ─► Whisper transcript
                    │
                    └─► recordings folder ─► Immich indexes ─► album + archive
```

## Offline first, for real

Each `MediaRecorder` chunk (two seconds of video) is written to IndexedDB in a single transaction together with per-recording counters. The recorder waits for every pending write before it marks a recording finished. That rule exists because of a real bug: the last chunk could be skipped if the stop event raced the final write.

One drain loop per recording uploads chunks in order, deletes each one locally once the server has accepted it, and retries network errors and 5xx responses with exponential backoff from 2 to 60 seconds. A 4xx is treated as permanent, so a bad chunk can't loop forever.

### Finalize only when the server has everything

Before finalizing, the client asks the server which chunk indices it holds. It only finalizes when they are contiguous and match the number of chunks the recorder produced, and only when nothing is still in flight. The server checks contiguity and the expected count again before accepting. Recordings interrupted by a reload are recovered on startup, and sessions that never got finalized are closed out after an hour idle on the client or a day on the server.

## Repairing what the browser produced

Concatenated browser chunks are not always a valid video. The FFmpeg pipeline tries three things in order: a decode preflight, a sanitize remux that discards corrupt packets, and finally a full VP9 and Opus re-encode. It probes the codecs to choose between a plain remux and a transcode (MP4 from phones becomes WebM), rejects results shorter than half a second, and keeps the longer file when two exist for the same recording.

On the way in, chunk writes take a lock per recording and go through a temp file and rename, so a chunk file is never half-written, and each chunk's EBML and cluster header bytes are checked. A channel-based semaphore keeps FFmpeg to two heavy jobs at a time on the home server.

## Streaming and transcripts

One FFmpeg `filter_complex` split produces 360p, 720p and 1080p variants, capped at the source height, with a quality target and a bitrate ceiling per rung, 6-second independent segments and a master playlist. Segments are served as immutable. In the browser, a service worker caches segments cache-first and playlists network-first, and the player falls back to the original WebM if HLS fails.

![Player](/projects/captains-logs/video-modal-desktop.webp "The player, with transcript toggle and actions to regenerate the transcript or the HLS ladder for a single log.")

For transcripts, the backend extracts 16 kHz mono Opus audio at 32 kbps and splits it into 10-minute segments to stay under the transcription API's upload limit, then runs Whisper on each.

## Immich without uploading

The backend never uploads to Immich. Immich indexes the recordings folder itself, and the backend's job is to find the new asset and organize it. For each new recording a watcher runs every five minutes until it succeeds: it finds the asset by device asset ID, or by filename in the current month's timeline bucket, adds it to a dedicated album, archives it so the journal stays out of the main photo timeline, and stores the asset ID. A daily pass catches anything missed.

If the local file is ever deleted, video and thumbnail requests are proxied to Immich with HTTP `Range` passed through, so seeking still works. Each log reports where it lives: local, Immich, or both.

## Auth

Sign-in is Google through Firebase, but the backend checks ID tokens itself, without the Admin SDK. It caches Google's public keys for an hour, refetches when it sees an unknown key ID, enforces RS256 and the expected audience and issuer, and then applies an email allowlist. It is a journal for exactly one person.

## Status

The web app and API are live on my server and in daily use. The mobile app is a working prototype: capture, a persistent resumable upload queue with per-part checksums, Google sign-in and a biometric lock work, but it hasn't shipped, and background uploads are still on the list. The repos are private.
