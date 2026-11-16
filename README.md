# JoJo AI Studio

Responsive developer workspace using the **OpenAI API only**. Import GitHub repositories or ZIP projects, edit source, receive streamed coding proposals, review/apply changes, generate transparent PNG logos, and export your work.

- Studio listens on **127.0.0.1:8095**; publish through Nginx HTTPS.
- 100 daily credits per authenticated user, non-cumulative, UTC. Each successful coding/logo request consumes one shared credit; failed reservations are refunded exactly once. Optional encrypted personal API keys use the user's OpenAI API billing instead.
- ChatGPT/Codex subscriptions are not reused as API credentials. Never provide ChatGPT passwords/cookies to this application.
- Real Android runs on a separate KVM/Docker worker; it is not a phone illustration or a hosted OpenAI feature.
- Runtime/hosting supports isolated Node builds and static publication; native APK compilation, arbitrary third-party/MCP plugins and SSR hosting are not implemented.

See [deployment and configuration](deploy/README.md), [verification](deploy/VERIFICATION.md), [Nginx upstream](deploy/studio-nginx.conf.example) and [PM2 configuration](deploy/ecosystem.config.cjs).
