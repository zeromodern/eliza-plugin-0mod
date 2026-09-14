# @zeromodern/eliza-plugin-0mod

[![npm](https://img.shields.io/npm/v/@zeromodern/eliza-plugin-0mod?style=flat-square)](https://www.npmjs.com/package/@zeromodern/eliza-plugin-0mod) [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square)](https://www.typescriptlang.org/) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[ElizaOS](https://github.com/elizaos/eliza) plugin that exposes [0mod API Gateway](https://api.0mod.com) edge tools as Eliza bot actions. HTTP 402 micropayments on Base EVM are handled automatically.

## Wallet & Network Prerequisites

0mod gateway utilities use **x402 HTTP 402 micropayments** on Base EVM:
- **Network:** Base Mainnet (`eip155:8453`)
- **Asset:** USDC on Base
- **Environment Variable:** `PAYER_PRIVATE_KEY=0x...` (or `EVM_PRIVATE_KEY` / `X402_PRIVATE_KEY`)

When `PAYER_PRIVATE_KEY` is present in your bot's environment, actions transparently sign payment authorizations and execute with zero manual intervention.

## Requirements

- Node.js >= 18
- npm >= 9

## Install

```bash
npm install @zeromodern/eliza-plugin-0mod
```

## Setup & Usage

### 1. Register Plugin in Eliza Character Config

Add the plugin to your ElizaOS character JSON file:

```json
{
  "name": "MyAgent",
  "plugins": ["@zeromodern/eliza-plugin-0mod"]
}
```

### 2. Environment Configuration

Set your wallet private key in your `.env` file:

```env
PAYER_PRIVATE_KEY=0x_your_private_key_here
```

### 3. Programmatic Usage Example

```typescript
import { zeroModPlugin, domainCheckAction } from "@zeromodern/eliza-plugin-0mod";

// The plugin automatically handles x402 payment signing when PAYER_PRIVATE_KEY is set in process.env
const result = await domainCheckAction.handler(
  runtime,
  { content: { text: "check domain example.com" } },
  state,
  options,
  (response) => {
    console.log("Domain Check Output:", response.text);
  }
);
```

## Practical Real-World Example: Autonomous DeFi Swap Guard ($1k/mo Execution Feed Alternative)

DeFi agents executing swaps on Base (Aerodrome, Uniswap) are vulnerable to toxic price divergence and MEV sandwiching. Traditional institutional execution protection feeds cost $1,000+/month.

Using `@zeromodern/eliza-plugin-0mod`, an agent can inspect live CEX-DEX spread candles and dislocation ticks via dynamic HTTP 402 micropayments on Base (see [api.0mod.com](https://api.0mod.com) for live pricing) prior to execution, halting or adjusting limit orders if adverse spread conditions are active.

See [`examples/dislocation_swap_guard.ts`](./examples/dislocation_swap_guard.ts) for the full runnable script.


## Available Actions

> 💡 **Pricing**: For live per-call pricing and endpoint status across all actions, visit [api.0mod.com](https://api.0mod.com) or fetch `https://api.0mod.com/api/v1/discovery`.

| Action Name | Description | Input Payload Example |
| :--- | :--- | :--- |
| `STEALTH_DOM_FETCH` | Headless web page fetch from Cloudflare edge | `{ "text": "https://example.com" }` |
| `AIRGAP_PII_SCRUB` | Redact SSN, phone, email, ZIP via Workers AI | `{ "text": "Call me at 555-0199" }` |
| `RAG_SHRINK_HTML` | Strip HTML boilerplate to clean Markdown for RAG | `{ "text": "<html>...</html>" }` |
| `CODE_DENOISE` | Remove comments, docstrings, sourcemaps from code | `{ "text": "const x = 1;" }` |
| `DOMAIN_CHECK` | Query RDAP registry for domain availability | `{ "text": "example.com" }` |
| `DEX_PRICE_SUMMARY` | Real-time DEX token price, volume, liquidity | `{ "text": "USDC" }` |
| `X_SENTIMENT` | Social & market sentiment scoring | `{ "text": "crypto market" }` |
| `IMAGE_OCR_SHRINK` | Vision OCR text and table extraction | `{ "text": "https://..." }` |
| `EMBED_TEXT` | 768-dim text embedding generation | `{ "text": "sample text" }` |
| `EMBED_MULTILINGUAL` | 1024-dim multilingual text embedding generation | `{ "text": "sample text" }` |
| `SUMMARIZE_TEXT` | Executive TL;DR document summarization | `{ "text": "long text string" }` |
| `CRYPTO_COVERAGE` | Check data coverage, supported pairs, and date boundaries | `{ "text": "coverage for AERO/USD" }` |
| `CRYPTO_SPREAD_CANDLES` | Fetch cross-venue CEX-DEX spread candles (OHLC) | `{ "text": "spread candles AERO/USD 2026-09-14" }` |
| `CRYPTO_DISLOCATIONS` | Fetch cross-venue market dislocation and spread arbitrage events | `{ "text": "dislocations AERO/USD 2026-09-14" }` |
| `CRYPTO_EXECUTION_LATENCY` | Benchmark cross-venue execution speed, venue latencies, and fill rates | `{ "text": "latency benchmarks 2026-09-14" }` |
| `CRYPTO_SHADOW_CAPACITY` | Measure uncaptured arbitrage volume capacity and capital constraint metrics | `{ "text": "shadow capacity 2026-09-14" }` |

## Ecosystem Packages

- 🤖 **MCP Server (Any AI Agent):** [`@zeromodern/mcp-server-0mod`](https://github.com/zeromodern/mcp-server-0mod)
- 🟣 **ElizaOS Plugin:** [`@zeromodern/eliza-plugin-0mod`](https://github.com/zeromodern/eliza-plugin-0mod)
- 🔵 **Coinbase AgentKit Provider:** [`@zeromodern/agentkit-provider-0mod`](https://github.com/zeromodern/agentkit-provider-0mod)
- ⚡️ **Live Gateway Service:** [api.0mod.com](https://api.0mod.com)

## Troubleshooting

- **Actions not loading:** Verify the plugin string matches exactly: `"@zeromodern/eliza-plugin-0mod"` in your character config.
- **Payment / Auth errors:** Ensure `PAYER_PRIVATE_KEY` is set with a valid Base EVM private key holding a USDC balance for x402 micropayments.

## License

MIT
