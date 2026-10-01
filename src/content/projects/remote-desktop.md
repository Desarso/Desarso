---
title: Archbox Connect
summary: Low-latency remote access to a Linux desktop running in a container. Game-streaming over a single HTTPS tunnel, plus a C bridge that gives a headless Wayland compositor a keyboard and mouse.
standfirst: Low-latency remote access to a Linux desktop that lives in a container. A one-command client tunnels game streaming over plain HTTPS, and a small C bridge turns virtual input devices into keyboard and mouse events for a Wayland compositor with no input of its own.
category: Home lab
year: 2026
status: In use
stack: [Go, C, Wayland, Sunshine, Moonlight, chisel, LXC]
source: https://github.com/Desarso/archbox-connect
cover: /projects/remote-desktop/cover.webp
coverAlt: Diagram of a Moonlight client tunneling over HTTPS to Sunshine in a container
order: 12
links:
  - label: archbox-connect
    href: https://github.com/Desarso/archbox-connect
  - label: evdev-bridge
    href: https://github.com/Desarso/evdev-bridge
endTitle: Two small tools, one desktop
endText: Both tools are public on GitHub and in daily use against my own server, which is private. The client is wired to that server, so it isn't something to try as-is.
---
I wanted my Linux desktop from anywhere, at game-streaming latency, without a VPN and without opening ports. The desktop runs inside an LXC container on a home server: Hyprland for the compositor and Sunshine for streaming. Moonlight is the client. Two pieces were missing, so I wrote them.

```text
Moonlight ─► localhost ─► archbox-connect (chisel client)
                              │  one HTTPS / WebSocket connection
                              ▼
                       chisel server ─► Sunshine (LXC container)
                                            │ virtual input devices
                                            ▼
                                     evdev-bridge ─► Hyprland
```

## archbox-connect: UDP through an HTTPS-only path

Moonlight needs a handful of TCP and UDP ports. [chisel](https://github.com/jpillora/chisel) can carry both, including UDP remotes, over a single WebSocket on HTTPS, so the host needs nothing open except a normal web endpoint. archbox-connect wraps that into one command: `go install …@latest && archbox-connect`.

On first run it asks for the tunnel password once (hidden input, saved with `0600` permissions). Then it downloads the right chisel binary for the OS and architecture, finds or installs Moonlight, starts the tunnel forwarding Sunshine's ports to `localhost`, launches Moonlight pointed at `localhost`, and reconnects if the tunnel drops. It is about 550 lines of Go and is versioned with tags so `@latest` resolves through the Go module proxy.

Windows was the hard part. Antivirus often flags chisel as a false positive. After several attempts (VBScript, PowerShell, renaming the binary), the client now raises a proper foreground UAC prompt through `ShellExecuteExW`, adds a Defender exclusion for its own folder only, waits on the elevated process, and extracts chisel in-process from the release zip.

## evdev-bridge: a keyboard for a compositor that has none

Inside the container, Sunshine creates virtual input devices under `/dev/input`, but Hyprland has no input backend there, so nothing reads them. evdev-bridge is about 760 lines of C that reads those devices and replays them into the compositor through the `zwlr_virtual_pointer_v1` and `zwp_virtual_keyboard_v1` Wayland protocols.

- **Keyboard.** It compiles an XKB keymap with libxkbcommon, shares it with the compositor through a file descriptor, tracks modifier state, ignores kernel autorepeat, and debounces duplicate presses within 100 ms, a problem that really showed up over the stream.
- **Smooth scrolling.** High-resolution wheel events arrive in 1/120-notch units. The bridge accumulates them, flushes on each sync report as smooth axis values plus discrete steps, and keeps the remainder, so trackpad scrolling from the client feels native.
- **One poll loop.** It polls the Wayland display and every input device together with the proper prepare-read and read-events dance, and exits when a device hangs up so systemd restarts it when Sunshine recreates its devices.

## Status

Both are in daily use. The repos are public. The server they talk to is private and password protected.
