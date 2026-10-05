# Kindred

A private, patient English practice partner for someone preparing for conversations that matter. Built for the Hacktoberfest Weekend Challenge: Build for a Friend.

## Run

Requires Node.js 20 or newer. No npm dependencies or install step.

```sh
npm start
```

Open http://127.0.0.1:3000. Choose **Try sample** to explore without a model. Sample feedback is scripted and explicitly labeled; it is not AI analysis.

For live AI practice, install [Ollama](https://ollama.com/download), then:

```sh
ollama pull qwen3:4b
```

Keep Ollama running, refresh the app, and choose **Start practicing**. Initial model downloads require internet. Once installed, inference uses a fixed loopback endpoint and the app needs no cloud API. Model speed and available memory depend on your machine. The Qwen3 4B download is about 2.5 GB.

To use another locally installed model, set OLLAMA_MODEL before starting the app (PowerShell):

```powershell
$env:OLLAMA_MODEL = 'qwen3:1.7b'
npm start
```

## Features

- Interview, everyday English, and presentation practice.
- Coaching prompt asks for encouragement, a useful correction, and a follow-up.
- Memory-only conversation history; reload or clear removes it from the app.
- Download session as plain text when you want to keep it.
- Local model readiness indicator and actionable connection errors.
- Maximum 12 exchanges per session and 4,000 characters per message.
- Responsive layout, keyboard-accessible controls, and plain-text rendering of model responses.

## Architecture and privacy

Browser → Node HTTP server on 127.0.0.1:3000 → Ollama on 127.0.0.1:11434 → local model. No CDN, analytics, external fonts, accounts, browser storage, or application chat logs. The server checks Host and Origin and limits request size. These are basic protections, not a security audit. Ollama and your operating system have their own behavior; downloaded exports remain until you delete them. Use local models rather than cloud-backed models to preserve local inference.

The source is MIT licensed. [Qwen3:4b](https://ollama.com/library/qwen3:4b) has an Apache 2.0 model license; [Ollama](https://github.com/ollama/ollama) is open source. The implementation follows the official [chat API](https://docs.ollama.com/api/chat). Open weights are central to live feedback, not a decorative integration.

## Verify

```sh
npm test
```

Tests cover input validation, local API payloads with a mocked model, app serving, cross-origin rejection, and model failures. Live inference requires Ollama and is not covered by the mock tests. Coach quality and latency must be evaluated with the chosen model and intended recipient.

## Submission checklist

See DEV_SUBMISSION.md for a draft. Before publishing, identify the real person this serves, test with them, fill the marked sections, add your public source repository and a demo video or deployed link, and verify the challenge deadline and tags. Do not describe the scripted sample as AI output. Optional: record and share an agent session using DevRelay as described in the challenge.
