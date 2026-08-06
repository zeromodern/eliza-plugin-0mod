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

export const zeroModPlugin = {
  name: "0mod-gateway",
  description: "0mod HTTP 402 Payment-gated edge tools for autonomous bots",
  actions: [stealthDomAction, airgapScrubAction, ragShrinkAction],
  evaluators: [],
  providers: [],
};

export default zeroModPlugin;
