---
title: Pageup
summary: Publish local HTML, a site folder or any file as an unlisted URL in one command. A zero-dependency Go CLI and server that sign every write with Ed25519.
standfirst: Publish a local HTML page, a folder of pages or any file as an unlisted, shareable URL with one command. A Go CLI and server with no dependencies beyond the standard library, where every write is an Ed25519-signed request.
category: Open source
year: 2026
status: Live
stack: [Go, Ed25519, Docker]
source: https://github.com/Desarso/pageup
live:
  label: Open pages.gabrielmalek.com
  href: https://pages.gabrielmalek.com
cover: /projects/pageup/cover.webp
coverAlt: Terminal running pageup report.html and printing a URL
order: 9
links:
  - label: pages.gabrielmalek.com
    href: https://pages.gabrielmalek.com
  - label: GitHub
    href: https://github.com/Desarso/pageup
endTitle: One command, one URL
endText: Pageup runs on my server and is public on GitHub. The embedded skill lets coding agents publish their own HTML reports.
---
Coding agents are good at writing HTML reports, and terrible at getting them in front of someone. Pageup closes that gap: `pageup report.html` uploads the page and prints a URL. The page is public to anyone with the link, there is no index, and nobody can create or change anything without a signed request.

```text
$ pageup report.html
https://pages.example.com/0192f6c1-…
```

## What it does

- **Pages.** `pageup report.html` publishes one page under a UUIDv7 URL.
- **Sites.** `pageup ./site` uploads a directory of up to 100 HTML files, keeping nested folders.
- **Files.** `pageup file a.png b.log` shares anything else, one URL per file.
- **Updates.** `pageup update URL path` replaces a page, site or file in place, so the link people already have keeps working.
- **Agents.** Every CLI binary embeds a skill that teaches coding agents how to publish, and `pageup skill install` drops it into an agent harness.

![pageup --help](/projects/pageup/cli-help.webp "The whole surface area of the CLI.")

## Signed requests, not passwords

Every write signs the method, path, a Unix timestamp, a random UUIDv7 nonce, and the SHA-256 of the body. The server rejects unknown keys, timestamps more than five minutes off, and replayed nonces. It only ever stores public keys.

New devices are added by pairing, not by copying a key around. `pageup init` creates a key pair on the new machine and prints a `pageup keys add …` command to run on a machine that's already an admin. Keys have roles (upload or admin) and can be listed and revoked, and the last admin key can't be revoked. Each page remembers which key created it, and only that key or an admin can change it.

## Streaming uploads that are still authenticated

For files, the CLI signs the file's hash in a header, so the server can authenticate the request before it reads the body. It hashes while it spools to a temp file, verifies, then streams to storage. Neither side ever holds the whole file in memory, and files up to 100 MiB go through by default.

## Serving files safely

Files are served with `http.ServeContent`, so range requests and media seeking work. Responses carry a SHA-256 ETag and `no-cache`, so an update shows up immediately while unchanged files revalidate cheaply. Images, PDFs, media, text and data open inline; HTML and SVG under the file path are sent as attachments so a shared file can't run active content on the domain. Site bundles are checked for path traversal, duplicate paths, non-HTML entries, file count and expanded size before they're stored.

## Status

Live on my server. About 5,400 lines of Go with no third-party modules, tested across the protocol, server, bundles and CLI. The server also hands out install scripts and cross-compiled CLI builds for Linux, macOS and Windows.
