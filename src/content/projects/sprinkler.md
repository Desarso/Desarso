---
title: Sprinkler Controller
summary: My home irrigation system. An installable web app schedules and runs watering zones, driving relays on an Orange Pi through a tiny HTTP API that has outlived three firmware generations.
standfirst: My home irrigation system. An installable web app schedules and runs watering zones and drives relay pins on a single-board computer through a tiny HTTP API that has survived three hardware and firmware generations unchanged.
category: Home lab
year: 2025–2026
status: In use
stack: [Next.js, TypeScript, C++, ESP32, Orange Pi, systemd]
cover: /projects/sprinkler/cover.webp
coverAlt: Sprinkler dashboard with one zone watering
order: 13
endTitle: Watering on schedule
endText: The controller runs on my home network, so there is no public URL. The repos are private. Screenshots use demo zones and a mock controller.
---
This is the controller for my home irrigation, run from an app on my phone: zones mapped to relay pins, manual runs with a duration, schedules, an emergency stop, and a log of everything that ran and why.

![Dashboard](/projects/sprinkler/dashboard-desktop.webp "The dashboard with one zone watering and a countdown. Demo zones and a mock controller.")

## One API, three generations of hardware

The board exposes a very small HTTP API: list pins, set or toggle a pin, set its mode, and report status. That API has stayed the same while everything under it changed:

1. A MicroPython socket server on an ESP32.
2. Arduino C++ firmware for the ESP32, built with PlatformIO, with a task watchdog, a Wi-Fi reconnect loop, scan diagnostics and credentials storable on the device.
3. A dependency-free C++17 server on an Orange Pi, using raw POSIX sockets, a hand-written HTTP parser and Linux sysfs GPIO, running as a systemd service with automatic restarts.

The Orange Pi version maps the 28 physical header pins to the SoC's GPIO numbers (bank × 32 + offset), exports them all as outputs and drives them low at boot, so a reboot never leaves a valve open. The web app didn't change its protocol across any of this.

## Watering that ends even if nobody is looking

![On a phone](/projects/sprinkler/dashboard-mobile.webp#phone) ![Schedules](/projects/sprinkler/zone-schedules-mobile.webp#phone "The dashboard and a zone's schedules on a phone.")

The web app is Next.js with a custom server-side scheduler:

- **Schedules** can be daily, weekly on chosen days, or every N hours. They are stored in local time and converted to UTC cron expressions using a configured time zone, with a debug endpoint for the time zone math.
- **Runs persist** with their scheduled stop time, and a server loop checks every five seconds and stops anything that has expired. Watering ends on time even if no browser is open and even across a server restart.
- **A master relay** powers the pump and valves. It switches on before the first zone and off after the last one, with a short cooldown.
- **Storage is a JSON file**, written to a temp file and renamed into place. A corrupt or empty file is backed up with a timestamp and replaced with defaults, and the activity log rotates separately at 3,000 entries.

### Getting around NAT loopback

My router can't reach its own public address from inside the network, so the installed app would break at home. A custom service worker sends API calls and navigation to the controller's LAN address when it's reachable, and falls back to the public HTTPS address when it isn't.

## Status

It waters my yard on schedule. The UI started from a generated scaffold; the scheduling, hardware API and firmware are mine. The repos are private.
