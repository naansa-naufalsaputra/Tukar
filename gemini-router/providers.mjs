const GEMINI_BASE = "https://generativelanguage.googleapis.com";

function parseNumber(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function now() {
  return Date.now();
}

function parseCsvList(value) {
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function createRouterConfig(env = process.env) {
  const order = parseCsvList(env.PROVIDER_ORDER);

  if (order.length === 0) {
    throw new Error("PROVIDER_ORDER is required and cannot be empty.");
  }

  const providers = order.map((name) => {
    const key = name.toUpperCase().replace(/[^A-Z0-9]/g, "_");
    const type = (env[`PROVIDER_${key}_TYPE`] || "apikey").trim().toLowerCase();
    const token = (env[`PROVIDER_${key}_TOKEN`] || "").trim();
    const budgetUsedPct = parseNumber(env[`PROVIDER_${key}_BUDGET_USED_PCT`], 0);

    if (type !== "apikey" && type !== "oauth") {
      throw new Error(`PROVIDER_${key}_TYPE must be 'apikey' or 'oauth'.`);
    }

    if (!token) {
      return null;
    }

    return {
      name,
      type,
      token,
      budgetUsedPct,
      state: {
        consecutive429: 0,
        consecutive5xx: 0,
        totalAttempts: 0,
        totalFailures: 0,
        cooldownUntil: 0
      }
    };
  }).filter(Boolean);

  if (providers.length === 0) {
    throw new Error("No valid providers loaded. Fill at least one PROVIDER_*_TOKEN.");
  }

  return {
    port: parseNumber(env.PORT, 8787),
    defaultModel: env.DEFAULT_MODEL || "gemini-2.5-flash",
    modelOrder: parseCsvList(env.MODEL_ORDER || env.DEFAULT_MODEL || "gemini-2.5-flash"),
    requestTimeoutMs: parseNumber(env.REQUEST_TIMEOUT_MS, 60000),
    maxRetriesPerRequest: parseNumber(env.MAX_RETRIES_PER_REQUEST, 2),
    cooldownMs: parseNumber(env.COOLDOWN_MS, 15 * 60 * 1000),
    max429BeforeCooldown: parseNumber(env.MAX_429_BEFORE_COOLDOWN, 2),
    max5xxBeforeCooldown: parseNumber(env.MAX_5XX_BEFORE_COOLDOWN, 3),
    providers
  };
}

export function maskedProviderName(name) {
  if (!name) {
    return "unknown";
  }
  if (name.length <= 4) {
    return `${name[0]}***`;
  }
  return `${name.slice(0, 2)}***${name.slice(-2)}`;
}

export function redactSecrets(input) {
  if (typeof input !== "string") {
    return input;
  }

  return input
    .replace(/AIza[0-9A-Za-z\-_]{20,}/g, "[REDACTED_API_KEY]")
    .replace(/Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/gi, "Bearer [REDACTED_TOKEN]")
    .replace(/"access"\s*:\s*"[^"]+"/g, '"access":"[REDACTED_TOKEN]"')
    .replace(/"refresh"\s*:\s*"[^"]+"/g, '"refresh":"[REDACTED_TOKEN]"');
}

export function getProviderPriority(provider) {
  const isCoolingDown = provider.state.cooldownUntil > now();
  if (isCoolingDown) {
    return Number.POSITIVE_INFINITY;
  }

  let score = 0;
  score += provider.state.consecutive429 * 100;
  score += provider.state.consecutive5xx * 50;
  score += Math.max(0, provider.budgetUsedPct - 80) * 5;
  score += provider.state.totalFailures;

  return score;
}

export function pickProvider(providers) {
  const ranked = [...providers].sort((a, b) => getProviderPriority(a) - getProviderPriority(b));
  const selected = ranked.find((p) => p.state.cooldownUntil <= now());
  return selected || ranked[0];
}

export function markProviderSuccess(provider) {
  provider.state.totalAttempts += 1;
  provider.state.consecutive429 = 0;
  provider.state.consecutive5xx = 0;
}

export function markProviderFailure(provider, statusCode, cfg) {
  provider.state.totalAttempts += 1;
  provider.state.totalFailures += 1;

  if (statusCode === 429) {
    provider.state.consecutive429 += 1;
    if (provider.state.consecutive429 >= cfg.max429BeforeCooldown) {
      provider.state.cooldownUntil = now() + cfg.cooldownMs;
      provider.state.consecutive429 = 0;
    }
    return;
  }

  if (statusCode >= 500) {
    provider.state.consecutive5xx += 1;
    if (provider.state.consecutive5xx >= cfg.max5xxBeforeCooldown) {
      provider.state.cooldownUntil = now() + cfg.cooldownMs;
      provider.state.consecutive5xx = 0;
    }
    return;
  }

  provider.state.consecutive429 = 0;
  provider.state.consecutive5xx = 0;
}

export function providerAuthHeaders(provider) {
  if (provider.type === "oauth") {
    return {
      Authorization: `Bearer ${provider.token}`
    };
  }
  return {};
}

export function providerUrl(provider, model) {
  if (provider.type === "apikey") {
    return `${GEMINI_BASE}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(provider.token)}`;
  }
  return `${GEMINI_BASE}/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function backoffDelayMs(attemptNumber) {
  const base = Math.min(4000, 400 * 2 ** attemptNumber);
  const jitter = Math.floor(Math.random() * 200);
  return base + jitter;
}
