---
title: AutoJob
summary: A self-hosted job-search console. It finds postings, tailors a résumé per job with an LLM, tracks applications and recruiter email, and autofills application forms from a browser extension.
standfirst: A self-hosted job-search console. It discovers postings, tailors a résumé to each one with an LLM, tracks applications and recruiter email, and autofills application forms from a Chrome extension. A human always clicks the final submit.
category: Tools
year: 2026
status: Personal tool
stack: [TypeScript, React, Express, SQLite, Chrome MV3, Electron, LLMs]
cover: /projects/autojob/cover.webp
coverAlt: AutoJob jobs feed with discovered postings
order: 11
endTitle: A tool, not a bot
endText: AutoJob runs locally as a personal tool. It never submits an application by itself, by design. The repo is private.
---
Applying for jobs is mostly copy and paste: find the posting, adjust the résumé, fill the same form fields for the twentieth time, then lose track of who replied. AutoJob is a console for that whole loop. It pulls postings from public job boards and applicant-tracking APIs, tailors a résumé per job, tracks every application and recruiter thread in one place, and fills in application forms from a browser extension. The one thing it will not do is press submit.

![Jobs feed](/projects/autojob/web-jobs.webp "The jobs feed with discovered postings. All companies and data in these screenshots are fictional.")

## What it does

- **Discovery.** Pulls postings from public job boards and the public APIs of common applicant-tracking systems, merges them round-robin so no source dominates, and filters by location.
- **Résumé tailoring.** A structured base résumé, imported from PDF or text, is tailored to a job description in three LLM steps: extract keywords and requirements, edit in place (from a light nudge to a full rewrite), then score the match with strengths, gaps and missing keywords.
- **Tracking.** A dashboard for the jobs feed, applications, companies, a résumé studio, an email center, alerts, and automation rules like a daily limit, a salary floor and a scam guard.
- **Email.** Gmail sync, AI reply drafts, and an approve-then-send flow.
- **Autofill.** A Manifest V3 Chrome extension opens the application and fills it from the profile and the tailored résumé.

![Résumé studio](/projects/autojob/web-resume-studio.webp "The résumé studio: pick a job, generate a tailored résumé, check the score, start autofill.")

## The interesting part: a browser agent that learns forms

Application forms are all different and all the same. The extension snapshots the visible form controls and sends them to the backend, which asks an LLM for the next safe actions: fill, select, check, upload, go to the next step, scroll or wait. The extension runs those actions in a bounded observe, plan and act loop. Submit is never on the list.

When a run succeeds, the backend stores it as a generalized workflow keyed by the site and a fingerprint of the portal. The next time it sees the same kind of form, it replays that workflow deterministically, without calling the LLM at all. The model does the exploration once, and the cache does the repetition.

## How it is built

- **One LLM interface, several backends.** A single chat-completions JSON interface sits in front of OpenRouter, OpenAI, GLM, a Codex-compatible endpoint, or a local Codex CLI subprocess. In auto mode it picks whichever backend has keys configured.
- **A durable action queue.** Side effects (email sync and drafts, résumé drafts, apply dry runs, a daily autopilot, company research) are queued as jobs and processed by a separate worker process.
- **A strangler migration.** The TypeScript backend replaced an earlier FastAPI and SQLAlchemy backend route by route. Both can still run behind the same Makefile, and the TypeScript store runs on a JSON file or SQLite with migrations in code.
- **Careful with tokens.** Gmail OAuth tokens are stored encrypted with a Fernet implementation in Node that stays compatible with the old Python backend. Firebase ID tokens are verified against Google's certificates, and CORS is allow-listed except for the extension's own routes.
- **CI.** Every workspace package is typechecked, tested and built, Playwright runs end to end against a mocked backend, and pytest covers the Python backend.

![Applications](/projects/autojob/web-applications.webp "The applications tracker with statuses, next actions and autofill buttons.")

## Status

AutoJob runs locally (`make dev`), with an Electron shell that starts the API and web app if they aren't running. There is also an Expo companion app, but it's an early prototype: only the overview and jobs feed are wired up. The repo is private.
