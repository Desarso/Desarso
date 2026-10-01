---
title: Godantic
summary: A Go framework for LLM agents, inspired by Pydantic AI. One model interface across providers, typed tool calling from plain Go functions, and streaming over HTTP, SSE and WebSockets.
standfirst: A Go framework for building LLM agents, inspired by Pydantic AI. One model interface across providers, tools that are ordinary Go functions, persistent chat history, and sessions built for browsers that talk back.
category: Open source
year: 2025–2026
status: Open source
stack: [Go, WebSockets, SSE, GORM, Postgres, SQLite]
source: https://github.com/Desarso/godantic
live:
  label: Read the docs
  href: https://desarso.github.io/godantic/
cover: /projects/godantic/cover.webp
coverAlt: Diagram of a Godantic agent session between a browser and model providers
order: 8
links:
  - label: Documentation
    href: https://desarso.github.io/godantic/
  - label: GitHub
    href: https://github.com/Desarso/godantic
endTitle: A library, in active development
endText: Godantic is Apache-2.0 on GitHub, at 0.1 and moving quickly. The docs site covers the agent loop, sessions, tools and stores.
---
[Pydantic AI](https://github.com/pydantic/pydantic-ai) made agent code feel like normal Python: typed tools, structured output, one interface for many models. I wanted that in Go, with one more requirement: the browser should be a first-class participant. Not just streaming text back, but a session that keeps talking both ways: tool updates, reasoning, execution traces, tools that run in the frontend, and audio.

## What it is

- **One model interface.** Adapters for Gemini, OpenRouter, Groq, Cerebras and Anthropic. The OpenAI-compatible ones take a custom base URL and key variable, so they work with other gateways too.
- **The agent loop.** Model call, tool call, tool result fed back, final answer, with history persisted through a pluggable message store on SQLite or Postgres.
- **Tools are Go functions.** A tool is an ordinary function. The model's JSON arguments are mapped onto typed Go parameters by reflection.
- **Three session layers.** Request and response over HTTP, streaming over channels and Server-Sent Events, and a WebSocket session with frontend-executed tools, trace streaming and optional text-to-speech audio.
- **Batteries.** Built-in tools for search, web fetch, files, shell, images, TypeScript execution, UI cards and a scheduled workflow system.

## Schemas from Go source

Tool schemas don't come from struct tags or hand-written JSON. A generator uses `go/packages` and `go/types` to read the function signatures themselves and writes JSON Schemas to a cache, driven by `go:generate`. At runtime the agent loads the cached schemas, so the function signature is the single source of truth.

## History that never breaks a provider

Stored chat history gets messy: a crash between a tool call and its result, a truncated window, a provider that rejects a dangling call. A sanitizer repairs history before every request, dropping orphaned tool responses and calls without a matching response, so a stored conversation never turns into an invalid turn sequence. Provider quirks live in the adapters. For example, the Gemini adapter keeps thought signatures on function calls and skips unsigned historical calls rather than failing.

## Observable by default

Agent work is meant to be watched. Tools can emit structured trace events (start, progress, end, error, with parent IDs) that the WebSocket session streams to the client and can persist. Hooks for tool results and errors classify failures from structured signals only (a Go error, a JSON `error` field, `ok: false`, an HTTP status of 400 or more) rather than by searching for scary words, and a panic inside a hook is recovered.

## Workflows

The workflow tool stores a script with a schedule (cron, once or interval) and runs it as a subprocess with capped logs, with separate process handling for Unix and Windows. The host can inject scoped environment variables but can't override reserved ones, and there is an end-to-end test for the whole path.

## Status

Godantic is a library at version 0.1 and under active development. About 17,000 lines of Go, tested with `go test ./...`. Tool approval is currently a stub that approves everything, so a human-approval flow is still to come.
