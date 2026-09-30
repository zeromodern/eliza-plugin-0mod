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

| Action Name | Description | Price | Input Payload Example |
| :--- | :--- | :--- | :--- |
| `STEALTH_DOM_FETCH` | Headless web page fetch from Cloudflare edge | dynamic | `{ "text": "https://example.com" }` |
| `AIRGAP_PII_SCRUB` | Redact SSN, phone, email, ZIP via Workers AI | dynamic | `{ "text": "Call me at 555-0199" }` |
| `RAG_SHRINK_HTML` | Strip HTML boilerplate to clean Markdown for RAG | dynamic | `{ "text": "<html>...</html>" }` |
| `CODE_DENOISE` | Remove comments, docstrings, sourcemaps from code | dynamic | `{ "text": "const x = 1;" }` |
| `DOMAIN_CHECK` | Query RDAP registry for domain availability | dynamic | `{ "text": "example.com" }` |
| `DEX_PRICE_SUMMARY` | Real-time DEX token price, volume, liquidity | dynamic | `{ "text": "USDC" }` |
| `X_SENTIMENT` | Social & market sentiment scoring | dynamic | `{ "text": "crypto market" }` |
| `IMAGE_OCR_SHRINK` | Vision OCR text and table extraction | dynamic | `{ "text": "https://..." }` |
| `EMBED_TEXT` | 768-dim text embedding generation | dynamic | `{ "text": "sample text" }` |
| `EMBED_MULTILINGUAL` | 1024-dim multilingual text embedding generation | dynamic | `{ "text": "sample text" }` |
| `SUMMARIZE_TEXT` | Executive TL;DR document summarization | dynamic | `{ "text": "long text string" }` |
| `CRYPTO_COVERAGE` | Check data coverage, supported pairs, and date boundaries | dynamic | `{ "text": "coverage for AERO/USD" }` |
| `CRYPTO_SPREAD_CANDLES` | Fetch cross-venue CEX-DEX spread candles (OHLC) | dynamic | `{ "text": "spread candles AERO/USD 2026-09-14" }` |
| `CRYPTO_DISLOCATIONS` | Fetch cross-venue market dislocation and spread arbitrage events | dynamic | `{ "text": "dislocations AERO/USD 2026-09-14" }` |
| `CRYPTO_EXECUTION_LATENCY` | Benchmark cross-venue execution speed, venue latencies, and fill rates | dynamic | `{ "text": "latency benchmarks 2026-09-14" }` |
| `CRYPTO_SHADOW_CAPACITY` | Measure uncaptured arbitrage volume capacity and capital constraint metrics | dynamic | `{ "text": "shadow capacity 2026-09-14" }` |
| `CRYPTO_LABELED_DISLOCATIONS` | Labeler-v2 dislocation events with execution-quality annotations | **$0.075/call** | `{ "text": "labeled dislocations AERO/USD 2026-09-14" }` |
| `CRYPTO_ATTRIBUTED_EXECUTIONS` | Per-arm attributed realized fills for AutoTune/reward analysis | **$0.075/call** | `{ "text": "attributed executions AERO/USD 2026-09-14" }` |
| `CRYPTO_IMPACT_SIMULATION` | Pre-trade impact sim vs LIVE L2 book (VWAP, slippage, fill probability) | **$0.075/call** | `{ "text": "simulate buy $25000 impact on AERO/USD" }` |

> ℹ️ Legacy utility actions are priced dynamically by the gateway; the three new crypto SKUs are flat **$0.075 USDC per call** on Base (`eip155:8453`). All prices are per HTTP 402 micropayment and are settled automatically when `PAYER_PRIVATE_KEY` is set.

### Usage Example: `CRYPTO_LABELED_DISLOCATIONS`

Labeler-v2 dislocation ticks carry execution-quality fields (`status_v2`, `sim_net_bps`, `dex_fee_embedded`, `regime`) that the raw `/dislocations` feed lacks — use them to backtest only the dislocations that were actually *capturable* net of DEX fees.

```typescript
import { zeroModPlugin } from "@zeromodern/eliza-plugin-0mod";

const action = zeroModPlugin.actions.find(a => a.name === "CRYPTO_LABELED_DISLOCATIONS")!;

await action.handler(
  {},
  { content: { text: "labeled dislocations AERO/USD 2026-09-14" } },
  undefined,
  undefined,
  (response: any) => {
    const { dislocations } = JSON.parse(response.text);
    const capturable = dislocations.filter((d: any) => d.status_v2 === "capturable");
    console.log(`${capturable.length} capturable ticks, mean sim_net_bps =`,
      capturable.reduce((s: number, d: any) => s + d.sim_net_bps, 0) / capturable.length);
  }
);
```

### Usage Example: `CRYPTO_ATTRIBUTED_EXECUTIONS`

Per-arm realized fills from the trade ledger — the ground-truth counterpart to the simulated dislocations above. Group by `arm_id` to compare which strategy arm actually earned `realized_net_usd` net of `belt_cost`.

```typescript
import { zeroModPlugin } from "@zeromodern/eliza-plugin-0mod";

const action = zeroModPlugin.actions.find(a => a.name === "CRYPTO_ATTRIBUTED_EXECUTIONS")!;

await action.handler(
  {},
  { content: { text: "attributed executions AERO/USD 2026-09-14" } },
  undefined,
  undefined,
  (response: any) => {
    const { executions } = JSON.parse(response.text);
    // Sum realized P&L per arm, keyed by the config hash that produced each fill.
    const byArm = new Map<string, number>();
    for (const e of executions) {
      byArm.set(e.arm_id, (byArm.get(e.arm_id) ?? 0) + e.realized_net_usd);
    }
    console.table([...byArm].map(([arm_id, net_usd]) => ({ arm_id, net_usd })));
  }
);
```

### Usage Example: `CRYPTO_IMPACT_SIMULATION`

Pre-flight every swap: ask the gateway what a hypothetical order would actually do to the live L2 book *before* touching custody. `executable: false` (or a low `fill_ratio`) means the order would sweep too deep and should be resized.

```typescript
import { zeroModPlugin } from "@zeromodern/eliza-plugin-0mod";

const action = zeroModPlugin.actions.find(a => a.name === "CRYPTO_IMPACT_SIMULATION")!;

// "buy" + "$25000" are parsed into { side: "buy", size_usd: 25000 } by the action's handler.
await action.handler(
  {},
  { content: { text: "simulate buy $25000 impact on AERO/USD" } },
  undefined,
  undefined,
  (response: any) => {
    const sim = JSON.parse(response.text);
    console.log(`VWAP ${sim.expected_fill_price} · slippage ${sim.slippage_bps} bps · fill ratio ${sim.fill_ratio}`);
    if (!sim.executable || sim.fill_ratio < 0.9) {
      throw new Error(`Order too large: only ${sim.fillable_size_usd} USD fillable. Resize before executing.`);
    }
  }
);
```


## Ecosystem Packages

- 🤖 **MCP Server (Any AI Agent):** [`@zeromodern/mcp-server-0mod`](https://github.com/zeromodern/mcp-server-0mod)
- 🟣 **ElizaOS Plugin:** [`@zeromodern/eliza-plugin-0mod`](https://github.com/zeromodern/eliza-plugin-0mod)
- 🔵 **Coinbase AgentKit Provider:** [`@zeromodern/agentkit-provider-0mod`](https://github.com/zeromodern/agentkit-provider-0mod)
- ⚡️ **Live Gateway Service:** [api.0mod.com](https://api.0mod.com)

## Troubleshooting

- **Actions not loading:** Verify the plugin string matches exactly: `"@zeromodern/eliza-plugin-0mod"` in your character config.
- **Payment / Auth errors:** Ensure `PAYER_PRIVATE_KEY` is set with a valid Base EVM private key holding a USDC balance for x402 micropayments.

## Release Process

Releases are cut manually by the owner via a **GitHub Release**. Creating the
Release publishes to npm; the owner chooses the major/minor/patch bump. Pushing
to `master` does **not** publish or create tags.

1. `npm version major|minor|patch` (updates `package.json` / `package-lock.json`, creates the `vX.Y.Z` commit + tag).
2. `git push origin master --follow-tags`.
3. Create a GitHub Release on the matching `vX.Y.Z` tag.
4. [`.github/workflows/publish.yml`](./.github/workflows/publish.yml) verifies the tag matches `package.json` and runs `npm publish --access public --provenance` **exactly once**.

See [RELEASING.md](./RELEASING.md) for full details, including the required
`NPM_TOKEN` GitHub secret.

## License

MIT
