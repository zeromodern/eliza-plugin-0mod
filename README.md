# `@elizaos/plugin-0mod`

ElizaOS plugin for **0mod API Gateway** (`api.0mod.com`) using HTTP 402 Payment Required micropayments.

## Actions Included

1. `STEALTH_DOM_FETCH`: Headless web page fetch from Cloudflare edge.
2. `AIRGAP_PII_SCRUB`: PII redaction engine (SSN, Phone, Email, ZIP) with Workers AI.
3. `RAG_SHRINK_HTML`: Strips HTML boilerplate down to clean Markdown/headings for RAG.

## Usage in ElizaOS Character Config

```json
{
  "plugins": ["@elizaos/plugin-0mod"]
}
```
