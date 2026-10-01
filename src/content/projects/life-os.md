---
title: Life OS
summary: Every device I own logs what actually happened into one event store. An AI coach reads it, keeps a notebook on what works, runs experiments, and messages me on Telegram.
standfirst: A personal operating system. Every device logs what actually happened into one event store, and an AI coach reads it, keeps a notebook on what works for me, runs one-variable experiments and checks in over Telegram.
category: Apps I use
year: 2026
status: In use
stack: [Bun, TypeScript, Postgres, React, Expo, Kotlin, Agent CLIs, Telegram]
cover: /projects/life-os/cover.webp
coverAlt: Life OS dashboard showing the Today view and a device timeline
order: 2
endTitle: Built for one, used every day
endText: Life OS has run my days since late September 2026. It is single-user by design and full of personal data, so the repo stays private and every screenshot here uses invented data.
---
Most productivity tools ask you to describe your day. Life OS records it instead. My desktop, laptop, phone, browser and wearable all report raw events into one Postgres table. Everything else (categories, a per-device timeline, how much of my waking time moved a goal, trends) is recomputed from those raw events on every request, so I can change my mind about what counts as "focus" and the past updates with it.

On top of that sits a coach: an AI agent with a notebook. It reads the data, keeps a "model of me" where every claim has evidence and a confidence, runs small experiments that change one variable at a time, and talks to me over Telegram, the web dashboard and its own phone app.

![Today view](/projects/life-os/dashboard-today.webp "The Today view: tiles for recovery, sleep, focus and distraction, a timeline of where the day went on each device, and goal alignment. All data here is invented.")

## One raw event store

Every source lands as rows in a single `events` table through one `POST /ingest` endpoint:

- **Desktop:** a Hyprland window watcher plus idle detection. On the Mac, an ActivityWatch forwarder.
- **Phone:** a Kotlin sensor inside the Coach app that reports app usage and unlocks, location visits, Health Connect data and what's playing.
- **Browser:** a Manifest V3 extension that reports the focused tab, video playback and whether I'm on a call.
- **Everything else:** a wearable, finance feeds, a sales CRM, coding-agent sessions, and the chat itself.

Collectors buffer locally in SQLite and push with a cursor. A unique key on `(device, local_id)` plus `ON CONFLICT DO NOTHING` means any collector can resend freely after being offline, and events the server generates get a deterministic 53-bit ID hashed from their source record. Nothing interpreted is ever stored.

### Turning events into a timeline

Focus, heartbeat and away events are replayed into contiguous segments per device. Away time is backdated by the idle timeout, and a gap longer than two and a half heartbeats becomes "offline", which is how suspend and shutdown show up without any special event.

![Trends](/projects/life-os/dashboard-trends.webp "Fourteen days of focus, distraction, recovery, sleep, bedtime and phone time. Invented data.")

## A coach with plain-file memory

The coach is not a custom model. It is an agent CLI (Claude Code and Codex by default, but any CLI works) running in a git clone of the repo. Its memory is a folder of Markdown and JSON: a charter, goals, the model of me, experiments, a playbook and a daily journal. After each run the server commits and pushes whatever the coach changed. That gives me a full, diffable history of what it believed and when; it made about 285 commits in its first five days.

It runs on a schedule: a morning plan at the first phone unlock (or 9:30), hourly check-ins where it decides whether it has anything worth saying, evening and weekly reviews, a weekly check for a better model, and follow-ups it schedules for itself. Quiet hours run from 23:00 to 07:00.

![Coach](/projects/life-os/dashboard-coach.webp "The Coach tab: goal rings and the coach's notebook. Invented goals.")

### Vendor-neutral, with fallback

The agent runner takes an ordered list of CLIs. A run that hits a usage limit, an auth error or a crash puts that CLI on a cooldown (an hour for limits, six hours for auth, ten minutes otherwise), and the next one answers. Both CLIs stream JSON, which the server turns into live progress in the chat ("reading me.md…"). Replies jump the job queue, and a burst of messages is debounced into one answer.

### A tiny protocol instead of tool calls

The agent doesn't get tools to send messages. Its final text is parsed for a few tags: `<reply>`, `<buttons>` for one-tap answers, `<followup at="…">` to schedule itself, and `<propose-agents>` to suggest a model upgrade. Upgrades are human in the loop: the coach proposes, I tap Yes in Telegram, and the server updates the CLIs and must pass a test prompt before switching.

### Least privilege

The agent runs as a separate Unix user with an allow-listed environment, so it can't read the server's own secrets (bank, Telegram, database) out of `/proc`. Finance data only reaches it as summaries inside the prompt.

![Chat](/projects/life-os/dashboard-chat.webp "The chat thread. It is the same conversation as Telegram, with one-tap answers. Invented conversation.")

## The Coach phone app

The phone half is an Expo and React Native app for Android with five tabs: Today, Trends, Goals, Chat and More. Most of its interesting parts are native:

- **A Kotlin sensor module.** App usage and unlocks from `UsageStatsManager`, location visits (staying within about 100 m for five minutes or more), Health Connect nutrition and body data read through change tokens (so edits and deletions arrive as events), and now-playing media sessions. A WorkManager job syncs every 15 minutes.
- **Voice memos.** Recorded in the chat, rejected if silent or shorter than a second, and uploaded by a native queue that survives the app closing. The server transcribes them and the coach answers.
- **Resumable uploads.** Shared by the web and the phone: create a file, then `PUT` 8 MB pieces at an offset, and on a mismatch the server answers 409 with the real offset. Uploads resume after a drop, and proxy body limits never apply. Audio and video are transcribed in 20-minute pieces.
- **Sign-in without passwords.** The app shows a code, and the coach's Telegram bot asks me to approve the device.
- **Permission UX as data.** The Sensors screen renders every grant it needs (usage access, background location, Health Connect, notification listener, microphone, battery optimization) with its state, why it's needed and a deep link to the right settings page.

The Coach app replaced an older standalone sensor app. Its collectors were ported with the same deterministic event-ID recipes and device naming, so the server saw one continuous phone through the switch.

## How it runs

One Bun process serves the API, the ingest endpoint and the React dashboard, on Postgres, deployed as a single Docker image on my self-hosted Coolify. Speech-to-text and text-to-speech handle voice notes in both directions. It also hosts [Life Tube](/projects/life-tube), the curated video front end.

## Status

Life OS has been in daily use since September 2026. It is single-user on purpose: the defaults, the coach's charter and the data are all mine. The repo is private and will stay that way. A public version would be a fresh repository with the code and none of the notebook.
