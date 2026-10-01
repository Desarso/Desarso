---
title: Mandelbrot WebGPU
summary: A deep-zoom Mandelbrot renderer in the browser. The arbitrary-precision reference orbit is computed on the GPU in WGSL, so zoom depth is limited by time, not by double precision.
standfirst: A Mandelbrot deep-zoom renderer that runs in the browser. It computes the arbitrary-precision reference orbit on the GPU in WGSL, perturbs every pixel against it, and skips most iterations with a bilinear approximation table.
category: Open source
year: 2024–2026
status: Live
stack: [TypeScript, WebGPU, WGSL, WebGL2, SolidJS, Vite]
source: https://github.com/Desarso/mandelbrot-webgpu
live:
  label: Try it live
  href: https://mandelbrot.gabrielmalek.com
cover: /projects/mandelbrot/cover.webp
coverAlt: Seahorse Valley in the Mandelbrot set
order: 10
links:
  - label: mandelbrot.gabrielmalek.com
    href: https://mandelbrot.gabrielmalek.com
  - label: GitHub
    href: https://github.com/Desarso/mandelbrot-webgpu
endTitle: Go zoom in
endText: The renderer is live and open source under the GPL. It works best in a browser with WebGPU; other browsers get a WebGL2 fallback that stops around 1e-34.
---
The Mandelbrot set is a few lines of math. The hard part is zooming. A 64-bit float runs out of precision around a zoom of 10¹⁵, and the interesting places are much deeper than that. Deep-zoom renderers solve this with one very precise reference orbit and cheap per-pixel deltas against it. This project does that in the browser, and puts the expensive arbitrary-precision part on the GPU too.

It is a WebGPU reimplementation that stands on a long line of work: perturbation theory for fractals from K. I. Martin, Pauldelbrot's glitch work, Zhuoran's rebasing, Claude Heiland-Allen's bilinear approximation, and the architecture of [FractalShark](https://github.com/mattsaccount364/FractalShark). That's why it's GPL.

![Seahorse Valley with the Places panel](/projects/mandelbrot/desktop-seahorse-valley.webp "Seahorse Valley, with the Places tab listing curated destinations. Captured on the WebGL2 fallback.")

## Arbitrary precision on the GPU

The reference orbit uses fixed-point, two's-complement big numbers made of 32-bit limbs. WGSL has no 64-bit integers, so each 32×32→64-bit multiply is built from 16-bit partial products. The recurrence is inherently serial, so the whole thing runs inside one 256-thread workgroup that coordinates with barriers. After each batch the CPU reads back a four-word status and nothing else. The number of limbs (8 up to 256) is chosen from the zoom depth, so shallow views stay cheap.

## Perturbation, with deltas that carry their own exponent

Each pixel iterates a small delta against the reference orbit. At deep zooms those deltas underflow even a float's exponent range, so they are stored as an explicit mantissa and exponent pair. Instead of detecting glitches after the fact, the renderer uses Zhuoran's rebasing rule to switch the delta back to the start of the orbit when it would go wrong.

## Skipping most of the work

A second-order bilinear approximation table stores, at doubling levels, how to jump many iterations at once, with coefficients that carry their own exponents too. The README records a run at a zoom of 2.8×10⁴⁰ that was 21 times faster with 96.9% of iterations skipped, and produced a bit-identical image.

The method is picked by depth: direct 32-bit floats for shallow views, plain perturbation down to about 10⁻²⁵ per pixel, and the extended-exponent deltas with the skip table below that.

## Staying responsive

GPUs kill shaders that run too long, so frames render in bands sized to a 50 ms budget. While the next frame computes, the last finished frame is reprojected to the new view, and resolution drops while you drag. Iteration and shading are separate passes, so changing the palette takes about a millisecond.

![On a phone](/projects/mandelbrot/phone-seahorse-valley.webp#phone "The same view on a phone, with the controls collapsed.")

## The rest

- **Places.** Ten curated destinations, down to a period-1215 minibrot at a span of 6×10⁻⁴². "Find minibrot here" Newton-solves for a nearby nucleus and flies to it.
- **Shareable state.** The URL holds the whole view, colouring, iteration count and language in a compact base36 code.
- **83 languages.** The UI and the explainer pages are translated, each locale is its own lazy-loaded chunk.
- **Verification.** 82 CPU tests, including the fixed-point arithmetic against a BigInt oracle, plus in-browser pages that check the real WGSL against BigInt, diff pixels between methods, and benchmark.

## Status

Live at [mandelbrot.gabrielmalek.com](https://mandelbrot.gabrielmalek.com). It is tested mainly in Chrome, and a lost GPU device currently needs a page reload.
