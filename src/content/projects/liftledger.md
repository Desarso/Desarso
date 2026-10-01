---
title: LiftLedger
summary: The workout logger I train with. Last session prefilled, volume per muscle, a Bluetooth smart scale and a meal-prep plan in one Android app.
standfirst: An Android workout logger that remembers what I lifted last time, pulls my weight from a Bluetooth scale, and tracks weekly volume per muscle and a meal-prep plan in the same place.
category: Apps I use
year: 2025–2026
status: In use
stack: [React Native, Expo, TypeScript, Go, Python, Health Connect]
cover: /projects/liftledger/cover.webp
coverAlt: LiftLedger home and active workout screens
order: 4
endTitle: In my pocket at the gym
endText: LiftLedger is on the Google Play internal testing track and is the app I log every session in. The repo is private for now.
---
Most workout apps make you type the same numbers every session. LiftLedger fills them in. Each set starts from what I lifted last time, the rest timer runs on its own, and the stats screen tells me whether I hit enough hard sets per muscle this week. It started as a weights tracker and grew to cover the whole loop around training: a bundled program that moves to the next day after each workout, a smart scale that logs body weight without me touching anything, and a meal-prep plan with targets that follow the weight trend.

![Home screen with today's program day](/projects/liftledger/home.webp#phone) ![Active workout with last session prefilled](/projects/liftledger/active.webp#phone "Today's program day, and an active workout. Each set is prefilled from the last session for that exercise. Screenshots use made-up data.")

## What it does

- **Programs.** Bundled 3, 4 and 5 day splits plus a strength program, each in two 4-week blocks. A calisthenics mode swaps the whole program to bodyweight movements.
- **Active workout.** Wheel pickers for weight and reps, a rest timer with a local notification, demo videos, exercise swaps that can be remembered, and a workout clock that ignores idle gaps over 30 minutes.
- **Sessions you can't lose.** The session is saved to the device as you go. You can save it for later, reopen a workout you finished early, and the app asks before a new workout replaces an unfinished one.
- **Stats.** Hard sets per muscle per week against a target, with secondary muscles counting half. Tonnage compared with last week, and a suggestion to raise the target once two full weeks hit it.
- **Body weight.** Manual entries, plus automatic weigh-ins from a Bluetooth smart scale. Trend chart, and body fat when the scale reports it.
- **Food.** Calorie and macro targets, a 14-day trend that suggests (never applies) a calorie change, a two-week meal-prep plan with a grocery list rounded to store pack sizes, and ticked meals written to Android Health Connect.

![Stats screen](/projects/liftledger/stats.webp#phone) ![Body weight screen](/projects/liftledger/weight.webp#phone) ![Food screen](/projects/liftledger/food.webp#phone "Weekly volume per muscle, body weight from the smart scale, and the meal-prep plan.")

## How it is built

The app is Expo and React Native on the new architecture, with HeroUI Native and Tailwind-style styling. The API is a small Go service that stores data per user. The smart scale talks to a Python listener on a home server. Releases are one `make` target.

```text
Android app (Expo / React Native)
   │  Firebase ID token
   ▼
Go API ──────────────► JSON store (atomic tmp + rename)
   ▲
   │  ingest token
Python BLE listener (systemd, on-disk queue) ◄── smart scale
```

### The API has no dependencies

The Go backend uses only the standard library. Google sign-in goes through Firebase Auth, but the API doesn't use the Firebase Admin SDK. It fetches Google's signing certificates, caches them for an hour, verifies the RS256 signature with `crypto/rsa`, and checks audience, issuer and expiry itself. Writes go to a temp file and are renamed into place, so a crash never leaves a half-written store.

### Offline first, and each set counted once

Exercise history lives on the phone first. It is written after every completed set and used to prefill the next session. The server copy only wins if it is newer, and every network call gives up after four seconds and falls back to local data, so a dead gym connection never blocks a workout.

Syncing history has two subtle rules. Each set is written exactly once: the session tracks how many sets of each exercise are already synced. And each set lands on the right day: unsynced sets are grouped per exercise per local day, so a workout that crosses midnight counts toward the right week. The heaviest working set, not a lighter back-off set, seeds next time's numbers.

### A scale that logs itself

The scale is a cheap Bluetooth body-composition scale. A Python listener on a home server picks up each weigh-in, queues it on disk and retries until the API accepts it. The API checks a separate ingest token with a constant-time compare, drops duplicate retries (same ID, or same weight within 60 seconds), rejects readings that are in the future or physically absurd, and holds readings unclaimed until a user taps **Link scale** in the app. Readings taken before linking get picked up too.

### Feeding Life OS

LiftLedger is also one of the main sources for [Life OS](/projects/life-os), my personal operating system. The coach there sees my calorie logs, the smart scale's weigh-ins and my workouts next to sleep and recovery data, so its advice about training and food is based on what actually happened.

### Health Connect without double counting

Ticking a meal writes it to Android Health Connect. Each serving gets a stable record ID per day, item and serving, and the sync makes Health Connect match the ticks exactly: insert what is new, delete what was unticked. Calls go through a serialized promise queue so fast taps can't race each other. The meal plan's macros, costs and grocery list are all computed from one ingredient table, so they always agree.

### One-command releases

`make release` reads the latest version code from Google Play through a small Go CLI on the Android Publisher API. It bumps the version in four files, has an LLM write release notes from the git log, builds the AAB and APK with Gradle, uploads to Play, then commits, tags and publishes a GitHub release with the APK attached.

## Status

LiftLedger is Android first and is on the Play internal testing track. I use it for every session. The web target is not maintained (the screenshots here come from a local web build with sign-in stubbed out and made-up data), there are no mobile tests yet, and storage is a single JSON file. That is fine for one user but is the first thing to change if it ever has more.
