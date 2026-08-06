export interface PluginAction {
  name: string;
  description: string;
  similes: string[];
  handler: (runtime: any, message: any, state?: any, options?: any, callback?: any) => Promise<boolean>;
}

export const stealthDomAction: PluginAction = {
  name: "STEALTH_DOM_FETCH",
  similes: ["FETCH_WEB_PAGE", "SCRAPE_URL", "GET_RAW_HTML"],
  description: "Fetches clean page content from Cloudflare edge bypassing simple IP blocks",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const url = message.content?.text || message.text;
    const res = await fetch("https://api.0mod.com/api/v1/stealth-dom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const airgapScrubAction: PluginAction = {
  name: "AIRGAP_PII_SCRUB",
  similes: ["SCRUB_PII", "REDACT_SENSITIVE_TEXT", "ANONYMIZE_TEXT"],
  description: "Redacts SSNs, phone numbers, emails, and ZIP codes using Cloudflare Workers AI",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const text = message.content?.text || message.text;
    const res = await fetch("https://api.0mod.com/api/v1/airgap-scrub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const ragShrinkAction: PluginAction = {
  name: "RAG_SHRINK_HTML",
  similes: ["CLEAN_HTML", "PARSE_HTML_FOR_RAG", "DENOISE_HTML"],
  description: "Strips HTML boilerplate down to structured Markdown/headings for RAG context windows",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const html = message.content?.text || message.text;
    const res = await fetch("https://api.0mod.com/api/v1/rag-shrink", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html }),
    });
    const data = await res.json();
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const codeDenoiseAction: PluginAction = {
  name: "CODE_DENOISE",
  similes: ["STRIP_COMMENTS", "COMPRESS_CODE", "CLEAN_CODE_PROMPT"],
  description: "Strips comments, docstrings, whitespace, and sourcemaps from code files",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const code = message.content?.text || message.text;
    const res = await fetch("https://api.0mod.com/api/v1/code-denoise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const domainCheckAction: PluginAction = {
  name: "DOMAIN_CHECK",
  similes: ["CHECK_DOMAIN_AVAILABILITY", "WHOIS_LOOKUP", "RDAP_LOOKUP"],
  description: "Queries global RDAP registry from edge for domain availability and WHOIS status",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const domain = message.content?.text || message.text;
    const res = await fetch("https://api.0mod.com/api/v1/domain-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });
    const data = await res.json();
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const dexPriceAction: PluginAction = {
  name: "DEX_PRICE_SUMMARY",
  similes: ["GET_TOKEN_PRICE", "CHECK_DEX_LIQUIDITY", "DEX_SEARCH"],
  description: "Fetches real-time DEX price, 24h volume, liquidity, and top pair stats across chains",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const query = message.content?.text || message.text;
    const res = await fetch("https://api.0mod.com/api/v1/dex-price-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const xSentimentAction: PluginAction = {
  name: "X_SENTIMENT",
  similes: ["ANALYZE_TWITTER_SENTIMENT", "TOKEN_SENTIMENT", "SOCIAL_BUZZ"],
  description: "Analyzes market & social sentiment for topics/tokens using Workers AI Llama 3.1",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const topic = message.content?.text || message.text;
    const res = await fetch("https://api.0mod.com/api/v1/x-sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });
    const data = await res.json();
    if (callback) callback({ text: JSON.stringify(data) });
    return true;
  },
};

export const imageOcrAction: PluginAction = {
  name: "IMAGE_OCR_SHRINK",
  similes: ["EXTRACT_IMAGE_TEXT", "OCR_IMAGE_TABLES", "PARSER_IMAGE"],
  description: "Extracts clean text and table markdown from images via Workers AI Vision Llama 3.2",
  handler: async (_runtime: any, message: any, _state?: any, _options?: any, callback?: any) => {
    const imageUrl = message.content?.text || message.text;
    const res = await fetch("https://api.0mod.com/api/v1/image-ocr-shrink", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    });
    const data = await res.json();
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
  ],
  evaluators: [],
  providers: [],
};

export default zeroModPlugin;
