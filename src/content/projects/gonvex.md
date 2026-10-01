---
title: Gonvex
summary: An open source, self-hosted realtime backend in the spirit of Convex. Postgres underneath, a Rust runtime, TypeScript functions in bounded V8 isolates, and a local replica on web and mobile.
standfirst: An open source, Convex-style realtime backend on Postgres. It started as Go functions compiled into a Go server and is now a Rust runtime that runs TypeScript in bounded V8 isolates and keeps a local replica on every client.
category: Open source
year: 2026
status: Beta
stack: [Rust, TypeScript, V8, Postgres, React, React Native, WebSockets]
source: https://github.com/Whagons-International/gonvex
live:
  label: Read the docs
  href: https://whagons-international.github.io/gonvex/
cover: /projects/gonvex/cover.webp
coverAlt: Diagram of a React hook talking to the Gonvex runtime over a WebSocket, with Postgres underneath
featured: true
order: 1
links:
  - label: Documentation
    href: https://whagons-international.github.io/gonvex/
  - label: GitHub
    href: https://github.com/Whagons-International/gonvex
  - label: npm
    href: https://www.npmjs.com/package/@gonvex/cli
endTitle: Beta, and open source
endText: Gonvex is Apache-2.0 on GitHub, with 0.5.1 on npm as the current release. The runtime, self-hosted stack, live queries, local replica, auth, multi-tenancy, scheduling and dashboard work. Migration rollouts, fleet backup and restore, and a hosted service are still on the way to 1.0.
---
[Convex](https://docs.convex.dev/home) gets one thing very right: the backend lives next to the app, functions are typed, and queries are subscriptions. Edit a backend function and the dev deployment updates, the generated types update, and every component that reads that data rerenders when it changes. No routes and no hand-written client SDK.

Gonvex keeps that loop and changes what's underneath. Data lives in Postgres, a database I already know how to run, back up, inspect and query with SQL. The whole platform is self-hostable, and multi-project and multi-tenant support are in the open source version, not held back for a hosted product. This write-up covers what Gonvex is now, and how it got there, because it has already been rebuilt once.

```tsx
import { api } from "./gonvex/_generated/api";
import { useReducer, useReplicaCollection } from "./gonvex/_generated/react";

export function Tasks() {
  const tasks = useReplicaCollection(api.tasks.list, {});
  const createTask = useReducer(api.tasks.create);
  return <TaskList tasks={tasks ?? []} onCreate={createTask} />;
}
```

## The development loop

A Gonvex app keeps its backend in a `gonvex/` folder beside the frontend. `gonvex dev` polls that folder every 500 ms. When something changes, it bundles the TypeScript module, regenerates the typed client bindings, and posts the result to the runtime, which applies any new SQL migrations and swaps in the new code. A failed sync retries every five seconds, and every few seconds the CLI checks that the runtime still has its code and re-sends it if a restart lost it.

On the server, a new module version is activated as a generation swap: calls already running finish on the old generation, new calls use the new one, and connected clients don't reconnect. That is what makes "edit a backend file and keep clicking around the app" feel the way it does in Convex.

## Version one: Go all the way down

The first Gonvex was built around a bet that backend functions should be compiled Go: fast, typed, and checked by a compiler that gives an LLM-assisted workflow immediate feedback. Functions and schema were written in Go, and the CLI uploaded the source to the runtime, which compiled it with `go build -buildmode=plugin` and loaded it into the server. Compiled plugins were cached on disk, keyed by a hash of the source and of the running server binary, because loading a plugin built for a different binary can poison the process. Since Go can't unload a plugin, a supervisor brought up a fresh worker on an inherited socket and drained the old one's WebSockets. The new worker had to reload every project before it reported healthy.

Realtime in v1 came from Postgres triggers and `LISTEN/NOTIFY`. Statement-level triggers reported which rows and columns changed. Functions declared what they read (tables, columns, filters, sort order) and what they wrote. A query only reran when a change actually touched something it depended on; an update to a column the query never looked at was ignored. Identical subscriptions shared one runner, unchanged results were suppressed, and large keyed lists went out as patches instead of full payloads.

That version got fast. The release notes for 0.1.28 record **182 ms p95 time-to-last-user** for about 1,700 connections and about 149,000 subscriptions at 1,000 simulated users, down from roughly 80 seconds at 250 users, after 38 rounds of optimization with a dedicated load runner.

### What v1 taught

Two problems were structural:

- **Isolation.** A Go plugin runs inside the server process with everything the server can reach. The project's own commit history says it plainly: the plugin process held credentials for every tenant database. A sandbox for agent-written Go was described as "a mitigation, not real isolation".
- **Precise invalidation for arbitrary SQL is hard.** When a function didn't declare what it read, the runtime had to guess the tables, and a wrong guess meant a subscription that silently missed updates.

## Version two: Rust host, TypeScript modules

Gonvex 0.5 moved the server to Rust and the application code to TypeScript. The runtime is about 45,000 lines of Rust on axum and sqlx. It owns HTTP and WebSockets, auth, tenant routing, Postgres transactions, the change feed, live queries, scheduling and storage. The Go server was retired; the production image runs no Go at all.

### Functions run in bounded V8 isolates

The CLI bundles the app's TypeScript into a single self-contained ES module and hashes the artifact. The runtime hands it to a separate module-host process, which runs it in pooled V8 isolates (via `deno_core`). The isolates are bounded:

- a 64 MiB heap per isolate, enforced by a near-heap-limit callback that terminates the call;
- 10 seconds for queries and reducers, 15 minutes for actions, enforced by a watchdog;
- an 8 MiB result cap;
- recycling after 10,000 calls, or immediately after a termination;
- no module loader, so nothing can be imported at call time.

Function code has no database handle of its own. Every effect is a host call (query, insert, update, fetch, schedule, storage) checked against capabilities the function declared. Queries and reducers can only touch the database. Network access is limited to declared origins.

### Three kinds of function

- **Queries** read from a repeatable-read, read-only snapshot.
- **Reducers** are the only way to write. Each runs in one host-owned transaction, is idempotent by key, and records where the call came from.
- **Actions** do external work, and never get a database handle.

A reducer that needs external work enqueues an action into an outbox table *in its own transaction*, so the business write and the intent to act commit or fail together. A scheduler claims outbox rows with `FOR UPDATE SKIP LOCKED`. Cron and delayed jobs work the same way, with leases that are renewed while they run.

```ts
import { reducer, schema } from "@gonvex/module-sdk";

export const create = reducer({
  args: schema.object({ id: schema.id("tasks"), title: schema.string() }),
  offline: { mode: "allowed", conflict: "expectedVersion" },
  optimistic: {
    effects: [{ operation: "upsert", entity: "tasks", id: ["id"],
                value: { id: { $arg: "id" }, title: { $arg: "title" } } }],
  },
  run: ({ db }, task) => db.insert("tasks", task),
});
```

### One committed change feed

v2 replaced invalidation guesses with a single source of truth. A per-row trigger writes old and new row images into a change table. A deferred constraint trigger runs once at commit: it stamps every change in the transaction with a revision from a single clock, records the transaction, and sends a `NOTIFY`. The notify is only a hint. The runtime always reads committed rows after its last revision and also polls every few seconds as a repair path. Readers that fall behind the retention window get an explicit reset instead of a gap.

On top of the feed sit two read paths:

- **Live Queries** have a structured plan: table, columns, filters, search, sort and window. Because the plan is data, the runtime derives exactly which tables (including visibility rules) can affect the result. On a relevant change it reruns the plan and sends a message only if the result changed.
- **Replica Collections** are bounded, authorized, single-table collections that live on the client. A client resumes from its last revision and receives one message per committed transaction, carrying every visible row change.

Access rules are one visibility plan per table. That plan compiles to SQL for snapshots and live queries, and the same rule is evaluated against the old and new rows in the change feed, so a row that stops being visible to someone disappears from their replica.

### A local replica on every client

The web client keeps the replica in IndexedDB; React Native uses a SQLite package, `@gonvex/expo-sqlite`. The store holds normalized entities, optimistic overlays, live-query memberships and pending commands, and each server transaction is applied atomically before subscribers are notified once.

Writes are optimistic. Reducers declare their effects, and those effects apply locally right away. Some reducers can run locally too: the same TypeScript reducer body executes against the replica in a worker with the network disabled, and is replayed in order when the server answers. Each reducer declares how it behaves offline: forbidden, allowed with a conflict policy, or online-only with a reason. Overlays are replaced when the change feed delivers the transaction that came from that command.

## Agents as API clients

Functions can be marked as interactive, with a description, tags and a confirmation level. `gonvex functions emit` turns the compiled artifact into a deterministic catalog, as NDJSON or TypeScript signatures, that includes the artifact hash. An agent action that asks for the `functions` capability can call any interactive function, and the host rechecks the hash, the argument schema, tenant membership, recursion depth and normal authorization first. A stale catalog fails loudly instead of calling the wrong version. The catalog describes the API. It doesn't grant access.

Agent-written code that needs to run arbitrary logic goes to a separate sandbox worker per execution. It chroots into a per-tenant workspace, drops to an unprivileged user, and installs a seccomp filter that denies the network.

## Projects, tenants and auth

A control-plane database knows about projects, tenants and accounts. In multi-tenant mode every tenant gets its own physical Postgres database, created on demand, and clients only ever name a project and a tenant, never a database. Accounts are global; members, roles and permissions live in each tenant's database and are projected back to the control plane.

Authentication can be Gonvex's own (native accounts and Google sign-in with PKCE), Firebase, any external OIDC provider, or a mix. Service principals let backends call functions with tightly scoped, hashed tokens, and can mint single-use grants to act on a member's behalf.

## Status

Gonvex is in beta. `@gonvex/cli`, `@gonvex/client`, `@gonvex/react`, `create-gonvex` and `@gonvex/expo-sqlite` are on npm at 0.5.1, and the repo is Apache-2.0. It was built in the open at Whagons, and the repo's release gate runs a compatibility suite against the Whagons 5 client before a version can be promoted. Still in progress before 1.0: migration previews and staged rollouts, automated tenant backup and restore, deployment automation, enterprise identity, and a hosted control plane.
