---
title: Life Tube
summary: A video front end that only shows videos an LLM has vetted against my goals, ranked by a pure function of the scores and how I actually watch. Web and native Android.
standfirst: A video front end that only shows videos an LLM has vetted against my goals, ranked by a pure, recomputable function of those scores and my own watch behavior. On the web and as a native Android app.
category: Apps I use
year: 2026
status: In use
stack: [Bun, TypeScript, Postgres, yt-dlp, LLM scoring, Expo, Kotlin]
cover: /projects/life-tube/cover.webp
coverAlt: Life Tube feed with goal chips and generated placeholder thumbnails
order: 6
endTitle: A feed with a budget
endText: Life Tube is live behind my own sign-in on the web and on the Play internal testing track for Android. It is part of Life OS, and the repo is private. It is not affiliated with YouTube.
---
The recommendation feed is the part of YouTube I wanted to keep, minus the part where it decides what I care about. Life Tube is a front end for YouTube videos where nothing reaches the feed until an LLM has scored it against my current goals. The ranking is a plain function I can read, the day has a watch budget, and a quiz one day and one week later asks whether the video was worth it.

![Life Tube home](/projects/life-tube/tube-home.webp "The home feed with goal chips and the daily budget. Titles, channels and thumbnails here are invented.")

## Where videos come from

Candidates come from three places: every video card my browser extension sees while I browse (the extension asks the server to classify them), seed channels and videos I list, and the channels of videos I finished.

Each candidate goes through a pipeline: an optional cheap pre-filter, then `yt-dlp` for metadata and captions, then one LLM run per video. The model scores goal alignment, information quality, novelty and clickability from 0 to 10, with a one-line "why", against my goals and what stage I'm at. Scoring runs a few at a time, niced, as an unprivileged user, and pauses once the stack holds 1,000 vetted, unwatched videos.

## Ranking is a pure function

The feed order comes from one function:

```text
base = 0.4·goal + 0.25·quality + 0.15·novelty + 0.2·clickability
     + log-scaled view prior
     + channel affinity (from watch time)
     + stage fit (how actionable the summary is)
     + thumbs (spread to channels and topics)
     − dismissals − impressions without a click
```

Scores are stored per rubric version, so changing the ranking never needs a re-score, and the function is unit-tested. The inputs are raw signals only: playback is reported in buckets of at most 15 seconds of actual playing (focused, unfocused or hidden, with rate, pauses and seeks), and marks, impressions and ratings are append-only events. A video is "watched" at 80% played and "abandoned" below 25% after two untouched days.

## The web app

The web app follows the familiar desktop layout and URL shapes (`/watch?v=`, `/results`, `/feed/history`, `/channel/…`) so muscle memory works. It has goal chips, a daily budget pill, search within the stack, a history that shows how engaged I was, and a watch page with an LLM summary and "ask this video", Q&A grounded in the transcript. The browser extension can redirect the YouTube home page to Life Tube, and only lets vetted videos or unlocked channels play on youtube.com itself.

Life Tube runs in the same Bun process as [Life OS](/projects/life-os), on a second port and host. Sessions are host-only cookies, handed across hosts with a one-use 60-second code. The data model is already multi-user: video facts and transcripts are shared, and queue, scores, notes and positions are per user, but the allowlist holds one person.

## The native app

![Life Tube on a phone](/projects/life-tube/tube-home-phone.webp#phone "The feed at phone width. The native Android app renders the same feed with native screens.")

The Android app is Expo and React Native with native screens for the feed, search, history, channels, goals and profile. The only web view is the player, and that player never reloads: one WebView lives as long as a video is open and moves between the expanded view and a draggable mini-player, so playback and watch telemetry keep going. Its base URL is my own host, so the embed gets the referrer the player requires. Picture-in-picture uses a small Kotlin module with native play and pause, because React Native pauses JavaScript timers in PiP. Background playback is deliberately not built, because the player's terms don't allow it.

Unlocked channels load their whole catalog through `yt-dlp --flat-playlist`, cached in Postgres and refreshed lazily when stale. The app pages them 48 at a time, with a local overlay for anything I marked on the phone.

## Status

The web app is live behind my sign-in, and the Android app (1.0.5) is on the Play internal testing track. Both are single-user. Life Tube is a personal front end; it is not affiliated with YouTube.
