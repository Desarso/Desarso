---
title: Hey Dax
summary: A browser voice assistant with a custom-trained wake word. Wake-word detection and voice activity run on-device in ONNX Runtime Web; speech, LLM and voice stream from the server with barge-in.
standfirst: A voice assistant in the browser with its own custom-trained wake word. The wake word and voice activity detection run on-device; speech-to-text, the LLM and text-to-speech stream from a server, and you can talk over it.
category: Experiments
year: 2026
status: Prototype
stack: [ONNX Runtime Web, JavaScript, Python, FastAPI, WebSockets, PyTorch]
cover: /projects/hey-dax/cover.webp
coverAlt: Diagram of the Hey Dax voice pipeline
order: 14
endTitle: A local prototype
endText: Hey Dax runs locally and isn't deployed. It needs a GPU for denoising and API keys for speech and language models. The repo is private.
---
Most browser voice demos make you hold a button. I wanted to just say a name. Hey Dax listens for "hey dax" entirely in the browser, cuts out what you say after it, and streams the rest of the conversation through a server, including the ability to interrupt it mid-sentence.

```text
mic ─► wake word (3 ONNX models, in browser) ─► Silero VAD ─► PCM over WebSocket
                                                                 │
     speaker ◄─ PCM16 24 kHz ◄─ TTS ◄─ LLM (streamed) ◄─ STT ◄─ denoise (GPU)
```

## A wake word that runs in the browser

The detector is a browser port of openWakeWord's streaming pipeline: three chained ONNX models. A mel-spectrogram model feeds an embedding model (96-dimensional embeddings over 76-frame windows), which feeds the wake-word classifier over the last 16 embeddings. Audio is processed in exact 1,280-sample chunks (80 ms) so the browser matches the Python reference, and a refractory period stops one "hey dax" from triggering twice. The classifier itself was trained for this project with openWakeWord's training pipeline on synthetic speech.

After the wake word, Silero VAD cuts complete utterances and sends them to the server as raw PCM. After five seconds of silence it goes back to listening for the wake word only.

## Merge or interrupt

The server denoises each utterance with a speech-enhancement model on the GPU, transcribes it, streams an LLM reply, and streams synthesized speech back as 24 kHz PCM. It also tracks which stage it's in, because a new utterance means different things at different times:

- **During denoising or transcription**, a new utterance is probably the rest of the same sentence. It's merged with the previous one (with a short silence between) and the pipeline restarts.
- **During the reply**, it's a barge-in. The running task is cancelled and the client gets an `interrupt_ack`.

The protocol is binary audio frames both ways plus a handful of JSON events: transcript, streamed reply tokens, TTS start and done, interrupt acknowledgements and errors. The prompt is shaped for speech: contractions, numbers spelled out, no lists, and ignore the wake word in the transcript.

## Status

A working local prototype. It isn't deployed, and only the wake word and voice activity detection run on-device; transcription, the LLM and speech synthesis are server-side.
