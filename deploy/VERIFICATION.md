# Web/Windows verification

Production Next.js build and TypeScript passed with local Monaco workers. Chromium at 1440px and 390px opened real PostgreSQL project files through the separate API, loaded Monaco without a CDN, navigated the command palette and docked terminal, and had no browser exceptions/horizontal overflow. The web holds no OpenAI/database runtime credentials.

A genuine Windows x64 portable Electron executable was packaged; its MZ/PE header and packaged app resources were checked. It was not launched on a native Windows host and is not a signed production installer. The public service must be deployed for the client to load.

Backend tests/worker validation now belong to ai_api. See deploy/AUDIT.md for explicit limitations rather than implied autonomous functionality.
