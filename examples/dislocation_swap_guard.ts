/**
 * Autonomous DeFi Swap Guard: Real-World Toxic Flow & Slippage Defense
 *
 * Problem:
 * Trading bots and DeFi agents executing swaps directly on DEXes frequently get
 * sandwiched by MEV searchers or trade into toxic price dislocations when CEX and DEX
 * prices diverge sharply. Traditional institutional warning feeds cost $1k+/month.
 *
 * Solution:
 * Using @zeromodern/eliza-plugin-0mod, the agent queries real-time CEX-DEX spread
 * candles and dislocations before submitting an on-chain transaction.
 * Slices are settled dynamically via HTTP 402 on Base (rates configured on gateway,
 * see api.0mod.com), protecting treasury funds from thousands of dollars in adverse slippage.
 *
 * Prerequisites:
 *   npm install @zeromodern/eliza-plugin-0mod viem
 *   export PAYER_PRIVATE_KEY="0x..." # Base wallet with USDC
 */

import { zeroModPlugin } from "@zeromodern/eliza-plugin-0mod";

interface SwapRequest {
  pair: string;
  amountUsd: number;
  maxDislocationBps: number;
}

async function guardDeFiSwap(swap: SwapRequest): Promise<{ approved: boolean; reason: string }> {
  console.log(`=== Pre-Flight Swap Guard: ${swap.pair} ($${swap.amountUsd} USD) ===`);

  // Locate the crypto spread candle and dislocation actions in the plugin
  const spreadCandleAction = zeroModPlugin.actions.find(a => a.name === "crypto_spread_candles");
  const dislocationAction = zeroModPlugin.actions.find(a => a.name === "crypto_dislocations");

  if (!spreadCandleAction) {
    throw new Error("crypto_spread_candles action not found in zeroModPlugin");
  }

  // 1. Fetch the latest 15m spread candle
  console.log(`[1/2] Checking CEX-DEX spread volatility on ${swap.pair}...`);
  let candleData: any = null;

  const mockRuntime = {};
  const candleMessage = {
    content: {
      pair: swap.pair,
      interval: "15m",
    },
  };

  await spreadCandleAction.handler(
    mockRuntime,
    candleMessage,
    undefined,
    undefined,
    (response: any) => {
      candleData = response.data || response;
    }
  );

  if (candleData && candleData.high_raw_spread_bps !== undefined) {
    console.log(`  Current High Spread: ${candleData.high_raw_spread_bps} bps`);
    console.log(`  Avg Net Spread:      ${candleData.avg_net_spread_bps} bps`);
    console.log(`  Dislocations Seen:   ${candleData.dislocation_count}`);

    // If peak dislocation exceeds threshold, check granular dislocation ticks
    if (candleData.high_raw_spread_bps > swap.maxDislocationBps) {
      console.log(`  ⚠️ High dislocation detected (${candleData.high_raw_spread_bps} > ${swap.maxDislocationBps} bps max allowable)`);

      if (dislocationAction) {
        console.log(`[2/2] Inspecting recent dislocation ticks...`);
        let dislocData: any = null;
        await dislocationAction.handler(
          mockRuntime,
          { content: { pair: swap.pair } },
          undefined,
          undefined,
          (response: any) => {
            dislocData = response.data || response;
          }
        );

        if (dislocData && dislocData.dislocations && dislocData.dislocations.length > 0) {
          const latestTick = dislocData.dislocations[0];
          console.log(`  🚨 Active Dislocation: Buy ${latestTick.buy_venue} @ $${latestTick.buy_price} / Sell ${latestTick.sell_venue} @ $${latestTick.sell_price}`);
          console.log(`  Net Gap: ${latestTick.net_spread_bps} bps. DEX price is lagging CEX lead price.`);
          return {
            approved: false,
            reason: `Swap REJECTED: Toxic price dislocation active (${latestTick.net_spread_bps} bps). Executing now would incur immediate adverse slippage.`,
          };
        }
      }
    }
  }

  console.log("  ✓ Spread conditions nominal (< hurdle threshold).");
  return {
    approved: true,
    reason: "Swap APPROVED: Venue prices in equilibrium. Zero toxic flow detected.",
  };
}

async function runDemo() {
  const result = await guardDeFiSwap({
    pair: "AERO/USD",
    amountUsd: 25000,
    maxDislocationBps: 35.0, // Alert if spread exceeds 0.35%
  });

  console.log("\nGuard Decision Result:");
  console.log(`Status:  ${result.approved ? "PROCEED TO EXECUTE" : "PAUSE / ABORT"}`);
  console.log(`Details: ${result.reason}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}

export { guardDeFiSwap };
