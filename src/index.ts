import { x402Client } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import { privateKeyToAccount } from "viem/accounts";

export interface PluginAction {
  name: string;
  description: string;
  similes: string[];
  handler: (runtime: any, message: any, state?: any, options?: any, callback?: any) => Promise<boolean>;
}

let cachedFetchClient: typeof fetch | null = null;

function getFetchClient(): typeof fetch {
  if (cachedFetchClient) return cachedFetchClient;
  const pkey = process.env.PAYER_PRIVATE_KEY || process.env.EVM_PRIVATE_KEY || process.env.X402_PRIVATE_KEY;
  if (!pkey) {
    cachedFetchClient = fetch;
    return fetch;
  }
  try {
    const client = new x402Client();
    const formattedKey = (pkey.startsWith("0x") ? pkey : `0x${pkey}`) as `0x${string}`;
    registerExactEvmScheme(client, { signer: privateKeyToAccount(formattedKey) });
    cachedFetchClient = wrapFetchWithPayment(fetch, client);
    return cachedFetchClient;
  } catch (err) {
    console.error("Failed to initialize x402 auto-payment client:", err);
    cachedFetchClient = fetch;
    return fetch;
  }
}

async function safeCallGateway(endpoint: string, body: Record<string, any>): Promise<any> {
  try {
    const fetchFn = getFetchClient();
    const res = await fetchFn(`https://api.0mod.com/api/v1/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 402) {
      let paymentInfo: any = {};
      const paymentHeader = res.headers.get("payment-required") || res.headers.get("x-payment-response");
      try {
        paymentInfo = await res.json();
      } catch {
        paymentInfo = { raw: await res.text() };
      }
      return {
        error: true,
        status: 402,
        message: "402 Payment Required — payment verification required",
        paymentHeader,
        paymentRequirements: paymentInfo,
      };
    }

    if (!res.ok) {
      const errorText = await res.text();
      return {
        error: true,
        status: res.status,
        message: `Gateway status ${res.status}`,
        details: errorText.slice(0, 500),
      };
    }

    return await res.json();
  } catch (error: any) {
    return {
      error: true,
      message: "Failed to connect to gateway",
      details: error?.message || String(error),
    };
  }
}

function extractUrl(text: string): string {
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : text.trim();
}

function extractDomain(text: string): string {
  const match = text.match(/([a-z0-9|-]+\.)+[a-z]{2,}/i);
  return match ? match[0].toLowerCase() : text.trim();
}

function extractPair(text: string): string {
  const match = text.match(/\b([A-Za-z0-9]+[\/-][A-Za-z0-9]+)\b/);
  return match ? match[1].replace('-', '/').toUpperCase() : "AERO/USD";
}

function extractDate(text: string): string | undefined {
  const match = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  return match ? match[1] : undefined;
}

export const stealthDomAction: PluginAction = {
  name: "STEALTH_DOM_FETCH",
  similes: ["FETCH_WEB_PAGE", "SCRAPE_URL", "GET_RAW_HTML"],
  description: "Fetches clean page content from Cloudflare edge bypassing simple IP blocks",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const rawText = message.content?.text || message.text || "";
    const url = extractUrl(rawText);
    const data = await safeCallGateway("stealth-dom", { url });
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const airgapScrubAction: PluginAction = {
  name: "AIRGAP_PII_SCRUB",
  similes: ["SCRUB_PII", "REDACT_SENSITIVE_TEXT", "ANONYMIZE_TEXT"],
  description: "Redacts SSNs, phone numbers, emails, and ZIP codes using Cloudflare Workers AI",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const text = message.content?.text || message.text || "";
    const data = await safeCallGateway("airgap-scrub", { text });
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const ragShrinkAction: PluginAction = {
  name: "RAG_SHRINK_HTML",
  similes: ["CLEAN_HTML", "PARSE_HTML_FOR_RAG", "DENOISE_HTML"],
  description: "Strips HTML boilerplate down to structured Markdown/headings for RAG context windows",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const html = message.content?.text || message.text || "";
    const data = await safeCallGateway("rag-shrink", { html });
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const codeDenoiseAction: PluginAction = {
  name: "CODE_DENOISE",
  similes: ["STRIP_COMMENTS", "COMPRESS_CODE", "CLEAN_CODE_PROMPT"],
  description: "Strips comments, docstrings, whitespace, and sourcemaps from code files",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const code = message.content?.text || message.text || "";
    const data = await safeCallGateway("code-denoise", { code });
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const domainCheckAction: PluginAction = {
  name: "DOMAIN_CHECK",
  similes: ["CHECK_DOMAIN_AVAILABILITY", "WHOIS_LOOKUP", "RDAP_LOOKUP"],
  description: "Queries global RDAP registry from edge for domain availability and WHOIS status",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const rawText = message.content?.text || message.text || "";
    const domain = extractDomain(rawText);
    const data = await safeCallGateway("domain-check", { domain });
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const dexPriceAction: PluginAction = {
  name: "DEX_PRICE_SUMMARY",
  similes: ["GET_TOKEN_PRICE", "CHECK_DEX_LIQUIDITY", "DEX_SEARCH"],
  description: "Fetches real-time DEX price, 24h volume, liquidity, and top pair stats across chains",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const query = message.content?.text || message.text || "";
    const data = await safeCallGateway("dex-price-summary", { query });
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const xSentimentAction: PluginAction = {
  name: "X_SENTIMENT",
  similes: ["ANALYZE_TWITTER_SENTIMENT", "TOKEN_SENTIMENT", "SOCIAL_BUZZ"],
  description: "Analyzes market & social sentiment for topics/tokens using Workers AI Llama 3.1",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const topic = message.content?.text || message.text || "";
    const data = await safeCallGateway("x-sentiment", { topic });
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const imageOcrAction: PluginAction = {
  name: "IMAGE_OCR_SHRINK",
  similes: ["EXTRACT_IMAGE_TEXT", "OCR_IMAGE_TABLES", "PARSER_IMAGE"],
  description: "Extracts clean text and table markdown from images via Workers AI Vision Llama 3.2",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const rawText = message.content?.text || message.text || "";
    const imageUrl = extractUrl(rawText);
    const data = await safeCallGateway("image-ocr-shrink", { imageUrl });
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const embedTextAction: PluginAction = {
  name: "EMBED_TEXT",
  similes: ["GENERATE_EMBEDDINGS", "VECTOR_EMBEDDING", "TEXT_EMBEDDING"],
  description: "Generates 768-dimensional dense vector embeddings for RAG & semantic search via BAAI BGE-Base",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const text = message.content?.text || message.text || "";
    const data = await safeCallGateway("embed-text", { text });
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const embedMultilingualAction: PluginAction = {
  name: "EMBED_MULTILINGUAL",
  similes: ["MULTILINGUAL_EMBEDDINGS", "LARGE_VECTOR_EMBEDDING", "EMBED_MULTILINGUAL_TEXT"],
  description: "Generates 1024-dimensional dense vector embeddings for multilingual & long text via BAAI BGE-Large",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const text = message.content?.text || message.text || "";
    const data = await safeCallGateway("embed-multilingual", { text });
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const summarizeAction: PluginAction = {
  name: "SUMMARIZE_TEXT",
  similes: ["TLDR_TEXT", "EXECUTIVE_SUMMARY", "CONDENSE_TEXT", "SUMMARIZE"],
  description: "Executive TL;DR text summarizer producing structured bullet points via Workers AI Llama 3.1",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const text = message.content?.text || message.text || "";
    const data = await safeCallGateway("summarize", { text });
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const cryptoCoverageAction: PluginAction = {
  name: "CRYPTO_COVERAGE",
  similes: ["CHECK_CRYPTO_COVERAGE", "TELEMETRY_COVERAGE", "CRYPTO_BOUNDARIES"],
  description: "Check data coverage, supported pairs, and date boundaries for crypto telemetry",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const rawText = message.content?.text || message.text || "";
    const pair = extractPair(rawText);
    const data = await safeCallGateway("crypto/coverage", { pair });
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const cryptoSpreadCandlesAction: PluginAction = {
  name: "CRYPTO_SPREAD_CANDLES",
  similes: ["GET_SPREAD_CANDLES", "CEX_DEX_CANDLES", "SPREAD_OHLC"],
  description: "Fetch cross-venue CEX-DEX spread candles (OHLC) for a token pair",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const rawText = message.content?.text || message.text || "";
    const pair = extractPair(rawText);
    const date = extractDate(rawText);
    const data = await safeCallGateway("crypto/spread-candles", { pair, date });
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const cryptoDislocationsAction: PluginAction = {
  name: "CRYPTO_DISLOCATIONS",
  similes: ["GET_DISLOCATIONS", "MARKET_DISLOCATIONS", "ARBITRAGE_DISLOCATIONS"],
  description: "Fetch cross-venue market dislocation and spread arbitrage events for a token pair",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const rawText = message.content?.text || message.text || "";
    const pair = extractPair(rawText);
    const date = extractDate(rawText);
    const data = await safeCallGateway("crypto/dislocations", { pair, date });
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const cryptoExecutionLatencyAction: PluginAction = {
  name: "CRYPTO_EXECUTION_LATENCY",
  similes: ["GET_EXECUTION_LATENCY", "BENCHMARK_LATENCY", "VENUE_LATENCIES"],
  description: "Benchmark cross-venue execution speed, venue latencies, and fill rates",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const rawText = message.content?.text || message.text || "";
    const date = extractDate(rawText);
    const data = await safeCallGateway("crypto/execution-latency", { date });
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const cryptoShadowCapacityAction: PluginAction = {
  name: "CRYPTO_SHADOW_CAPACITY",
  similes: ["GET_SHADOW_CAPACITY", "UNCAPTURED_VOLUME", "ARBITRAGE_CAPACITY"],
  description: "Measure uncaptured arbitrage volume capacity and capital constraint metrics",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const rawText = message.content?.text || message.text || "";
    const date = extractDate(rawText);
    const pair = extractPair(rawText);
    const data = await safeCallGateway("crypto/shadow-capacity", { date, pair });
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const zeroModPlugin = {
  name: "0mod-gateway",
  description: "0mod HTTP 402 Payment-gated edge tools for autonomous bots",
  actions: [
    stealthDomAction,
    airgapScrubAction,
    ragShrinkAction,
    codeDenoiseAction,
    domainCheckAction,
    dexPriceAction,
    xSentimentAction,
    imageOcrAction,
    embedTextAction,
    embedMultilingualAction,
    summarizeAction,
    cryptoCoverageAction,
    cryptoSpreadCandlesAction,
    cryptoDislocationsAction,
    cryptoExecutionLatencyAction,
    cryptoShadowCapacityAction,
  ],
  evaluators: [],
  providers: [],
};

export default zeroModPlugin;
