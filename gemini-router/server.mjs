import http from "node:http";
import { randomUUID } from "node:crypto";
import {
  backoffDelayMs,
  createRouterConfig,
  markProviderFailure,
  markProviderSuccess,
  maskedProviderName,
  pickProvider,
  providerAuthHeaders,
  providerUrl,
  redactSecrets,
  sleep
} from "./providers.mjs";

const config = createRouterConfig(process.env);

function safeLog(message, extra) {
  const payload = extra ? ` ${JSON.stringify(extra)}` : "";
  process.stdout.write(`${message}${redactSecrets(payload)}\n`);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 2_000_000) {
        reject(new Error("Body too large"));
      }
    });

    req.on("end", () => {
      if (!raw) {
        reject(new Error("Request body is required"));
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function writeJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(body));
}

function normalizeToGeminiGenerateContent(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload must be a JSON object");
  }

  const hasGeminiFormat = Array.isArray(payload.contents);
  if (hasGeminiFormat) {
    return payload;
  }

  const maybeMessages = payload.messages;
  if (!Array.isArray(maybeMessages)) {
    throw new Error("Unsupported payload format. Expected `contents` or `messages`.");
  }

  const contents = maybeMessages
    .map((msg) => {
      if (!msg || typeof msg !== "object") {
        return null;
      }
      const role = msg.role === "assistant" ? "model" : "user";
      const text = typeof msg.content === "string" ? msg.content : "";
      if (!text.trim()) {
        return null;
      }
      return {
        role,
        parts: [{ text }]
      };
    })
    .filter(Boolean);

  if (contents.length === 0) {
    throw new Error("No usable message content found");
  }

  const out = { contents };
  if (payload.generationConfig && typeof payload.generationConfig === "object") {
    out.generationConfig = payload.generationConfig;
  }
  if (Array.isArray(payload.safetySettings)) {
    out.safetySettings = payload.safetySettings;
  }
  if (payload.systemInstruction && typeof payload.systemInstruction === "object") {
    out.systemInstruction = payload.systemInstruction;
  }

  return out;
}

async function callGemini({ provider, model, body, requestId }) {
  const url = providerUrl(provider, model);
  const headers = {
    "content-type": "application/json",
    ...providerAuthHeaders(provider)
  };

  const ctrl = new AbortController();
  const timeout = setTimeout(() => {
    ctrl.abort();
  }, config.requestTimeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: ctrl.signal
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      safeLog("provider_failed", {
        requestId,
        provider: maskedProviderName(provider.name),
        statusCode: response.status,
        error: data
      });
      return {
        ok: false,
        statusCode: response.status,
        body: data
      };
    }

    return {
      ok: true,
      statusCode: response.status,
      body: data
    };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    const statusCode = isAbort ? 408 : 503;
    safeLog("provider_exception", {
      requestId,
      provider: maskedProviderName(provider.name),
      statusCode,
      message: error instanceof Error ? error.message : "unknown"
    });
    return {
      ok: false,
      statusCode,
      body: {
        error: {
          message: isAbort ? "Request timeout" : "Provider request error"
        }
      }
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function routeGenerateContent(req, res) {
  const requestId = randomUUID();
  const modelFromPath = req.url?.includes(":generateContent")
    ? req.url.replace("/v1beta/models/", "").replace(":generateContent", "")
    : undefined;

  let body;
  try {
    const incoming = await parseJsonBody(req);
    body = normalizeToGeminiGenerateContent(incoming);
  } catch (error) {
    writeJson(res, 400, {
      requestId,
      error: error instanceof Error ? error.message : "Bad request"
    });
    return;
  }

  const models = modelFromPath ? [modelFromPath] : config.modelOrder;
  let lastFailure = null;

  for (const model of models) {
    for (let attempt = 0; attempt <= config.maxRetriesPerRequest; attempt += 1) {
      const provider = pickProvider(config.providers);

      safeLog("provider_attempt", {
        requestId,
        attempt,
        model,
        provider: maskedProviderName(provider.name),
        providerType: provider.type
      });

      const result = await callGemini({ provider, model, body, requestId });

      if (result.ok) {
        markProviderSuccess(provider);
        writeJson(res, 200, {
          requestId,
          servedBy: provider.name,
          model,
          data: result.body
        });
        return;
      }

      markProviderFailure(provider, result.statusCode, config);
      lastFailure = {
        provider: provider.name,
        model,
        statusCode: result.statusCode,
        body: result.body
      };

      if (attempt < config.maxRetriesPerRequest) {
        const delay = backoffDelayMs(attempt);
        await sleep(delay);
      }
    }
  }

  writeJson(res, 503, {
    requestId,
    error: "All configured providers failed",
    lastFailure
  });
}

function routeHealth(_req, res) {
  const now = Date.now();
  const providers = config.providers.map((provider) => ({
    name: provider.name,
    type: provider.type,
    budgetUsedPct: provider.budgetUsedPct,
    cooldownRemainingMs: Math.max(0, provider.state.cooldownUntil - now),
    totalAttempts: provider.state.totalAttempts,
    totalFailures: provider.state.totalFailures
  }));

  writeJson(res, 200, {
    status: "ok",
    defaultModel: config.defaultModel,
    modelOrder: config.modelOrder,
    providers
  });
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    writeJson(res, 400, { error: "Invalid request" });
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    routeHealth(req, res);
    return;
  }

  if (req.method === "POST" && req.url.startsWith("/v1beta/models/") && req.url.endsWith(":generateContent")) {
    await routeGenerateContent(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/opencode/generate") {
    await routeGenerateContent(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/generate") {
    await routeGenerateContent(req, res);
    return;
  }

  writeJson(res, 404, {
    error: "Not found"
  });
});

server.listen(config.port, "0.0.0.0", () => {
  safeLog("router_started", {
    port: config.port,
    defaultModel: config.defaultModel,
    providerCount: config.providers.length
  });
});
