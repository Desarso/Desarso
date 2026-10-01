---
title: Uni
summary: A Brilliant-style learning app where I type a topic, an AI agent writes an interactive course, and a validator recomputes every answer before I see it.
standfirst: A personal learning app with interactive lesson cards, spaced review and a daily streak. New courses are written on demand by an AI agent and only show up once a validator has checked the math.
category: Apps I use
year: 2026
status: In use
stack: [Bun, TypeScript, React, SQLite, KaTeX, Agent CLIs]
cover: /projects/uni/cover.webp
coverAlt: Uni lesson with an interactive Bayes plot and a phone showing an icon array
order: 3
links:
  - label: uni.gabrielmalek.com (sign-in only)
    href: https://uni.gabrielmalek.com
endTitle: One learner, on purpose
endText: Uni is live behind my own login, so visitors only see the sign-in screen. It has exactly one learner and no plans for more. The repo is private for now.
---
I wanted something like Brilliant for whatever I happen to be curious about that week: short lessons where you move a slider until something clicks, instead of reading a chapter. Uni is that app, built for one learner. I type a topic, an AI agent writes a course, and the course only appears once a validator has re-done its math. Wrong answers come back later through spaced review, and a streak keeps me honest.

![Home screen with a streak and a continue card](/projects/uni/home-phone.webp#phone) ![Course page with a unit timeline](/projects/uni/course-phone.webp#phone) ![Interactive linear transform card](/projects/uni/lesson-transform-phone.webp#phone "Home with the streak and review queue, a course timeline, and an interactive card where you drag the basis vectors to build a rotation.")

## What a lesson is

A lesson is 8 to 14 cards. Some are plain text. Some are multiple choice, where every wrong option carries its own explanation. Some ask for a number with a tolerance, or a percent or currency format. Some ask you to put steps in order. The interesting ones are interactive: you move sliders or drag vectors until a goal expression becomes true, and widgets redraw as you go. There are function plots with curves, points and shading, a 2D linear transform with draggable basis vectors and a live determinant, icon arrays, bars and readouts. Math renders with KaTeX.

![Bayes plot with a live posterior readout](/projects/uni/lesson-plot-desktop.webp "An interactive card from the probability course. Move the prior and watch the posterior update.")

Missed cards go into SM-2 spaced review. The streak allows one rest day. The layout is phone first, with a desktop layout and a dark mode.

## Courses written on request

The **Teach me** form takes a topic, a level and optional notes. That queues a job. The server runs an agent CLI (Claude Code or Codex), which writes the course as JSON. The validator checks it, and if it fails, the errors go back to the agent for up to three repair rounds. When a course passes, it shows up marked **New** and a Telegram message says it is ready. Two of the current courses were written by hand. The third, a linear algebra course built around pictures, came out of the generator.

![The Teach me form](/projects/uni/new-course-desktop.webp "The Teach me form. Pick a topic and a level, and an agent writes the course in the background.")

## How it is built

Uni is about 2,700 lines of TypeScript. Bun does the HTTP routing, SQLite and tests. The client is React 19 and Vite with hand-written CSS and no UI kit. It runs in Docker on my self-hosted Coolify, with the agent CLIs installed in the image.

### A small expression language instead of eval

Agent-written content has to compute things: the correct answer, whether a goal is met, what a widget shows. None of that can be JavaScript. Uni has its own tokenizer and precedence-climbing parser for arithmetic, comparisons, ternaries and a whitelisted set of functions, including `choose`, `binom`, `normpdf` and `normcdf` (via an Abramowitz–Stegun approximation of erf). There is no property access and no `eval`, so a course can't execute code. The same parser runs on the server and in the browser.

### A validator that does the math

Schema checks (zod) are the easy part. The validator also:

- recomputes every numeric answer from the card's `verify` expression;
- checks that the correct multiple-choice option is the only one equal to the computed value;
- renders all KaTeX up front, and catches prices like `$20` being parsed as math;
- proves that every interactive goal is reachable, by searching the slider space exhaustively up to 200,000 combinations and sampling randomly above that.

Error messages are written for the agent, so a repair round has something concrete to fix.

### Vendor-neutral agents, with less privilege

The agents are just a list of CLI commands tried in order. Both CLIs stream JSON events, and Uni turns them into short progress lines like "Checking answer keys". The agent runs as an unprivileged user with an allow-listed environment, so it can't read the server's own secrets.

### A job queue that survives deploys

Generation can take a while, and deploys happen in the middle of it. Jobs live in SQLite and are claimed with a conditional `UPDATE`, which makes the claim atomic. Each job has an owner ID and a 30-second heartbeat, gets taken over after 3 minutes without one, and is tried at most 3 times. On `SIGTERM` the server aborts its agent and hands the job back. I tested this by killing a job mid-deploy.

### Login over Telegram

There are no passwords. I ask for a login link, and Telegram delivers a one-time link valid for 15 minutes. Tokens and sessions are stored only as SHA-256 hashes. Opening the link only renders a confirm button, and the POST is what consumes the token, so Telegram's link-preview crawler can't burn it.

## Status

Uni is live and I use it. It is deliberately single-user: there are no other learners, and every page except the login screen sits behind my account. The first version came together in a day. The repo is private for now.
