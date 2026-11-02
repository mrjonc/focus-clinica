(() => {
  const CACHE_PREFIX = "focus:github-profile:v2:";
  const FRESH_TIME = 60 * 60 * 1000;
  const STALE_TIME = 7 * 24 * FRESH_TIME;
  const FAILURE_PAUSE = 60 * 1000;
  const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
  const memory = new Map();
  const pending = new Map();
  const failures = new Map();
  let blockedUntil = 0;

  class ProfileError extends Error {
    constructor(code) {
      super(code);
      this.code = code;
    }
  }

  const text = (value) => (typeof value === "string" ? value.trim() : "");

  function safeUrl(value, { hosts = [], allowLocal = false } = {}) {
    const input = text(value);
    if (!input) return null;
    try {
      const url = allowLocal
        ? new URL(input, document.baseURI)
        : new URL(input);
      if (
        !["https:", "http:"].includes(url.protocol) ||
        url.username ||
        url.password
      )
        return null;
      if (
        hosts.length &&
        (url.protocol !== "https:" || !hosts.includes(url.hostname))
      )
        return null;
      return url.href;
    } catch {
      return null;
    }
  }

  function normalizeProfile(data) {
    const login = text(data?.login);
    if (!USERNAME_PATTERN.test(login))
      throw new ProfileError("invalid-response");
    // Armazena apenas os campos usados nos cards.
    return {
      name: text(data.name) || login,
      photo: safeUrl(data.avatar_url, {
        hosts: ["avatars.githubusercontent.com", "github.com"],
      }),
      github: `https://github.com/${encodeURIComponent(login)}`,
    };
  }

  function readStorage(key) {
    try {
      return localStorage.getItem(CACHE_PREFIX + key);
    } catch {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, value);
    } catch {
      /* Cache em memória continua disponível. */
    }
  }

  function readCache(key) {
    try {
      const entry = memory.get(key) || JSON.parse(readStorage(key));
      if (
        !entry ||
        !Number.isFinite(entry.savedAt) ||
        entry.savedAt > Date.now() ||
        Date.now() - entry.savedAt >= STALE_TIME
      )
        return null;
      const github = safeUrl(entry.profile?.github, { hosts: ["github.com"] });
      const login = github && new URL(github).pathname.slice(1);
      if (!login || !USERNAME_PATTERN.test(login)) return null;
      const profile = normalizeProfile({
        login,
        name: entry.profile.name,
        avatar_url: entry.profile.photo,
      });
      const cached = { profile, savedAt: entry.savedAt };
      memory.set(key, cached);
      return cached;
    } catch {
      return null;
    }
  }

  function writeCache(key, profile) {
    const entry = { profile, savedAt: Date.now() };
    memory.set(key, entry);
    writeStorage(key, JSON.stringify(entry));
  }

  function pauseRequests(response) {
    const retry = response.headers.get("retry-after");
    const retryAt =
      retry && /^\d+$/.test(retry)
        ? Date.now() + Number(retry) * 1000
        : Date.parse(retry);
    const resetAt =
      response.headers.get("x-ratelimit-remaining") === "0"
        ? Number(response.headers.get("x-ratelimit-reset")) * 1000
        : 0;
    blockedUntil = Math.max(
      Date.now() + FAILURE_PAUSE,
      retryAt || 0,
      resetAt || 0,
    );
    writeStorage("blocked-until", String(blockedUntil));
  }

  async function requestProfile(key) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(
        `https://api.github.com/users/${encodeURIComponent(key)}`,
        {
          headers: { Accept: "application/vnd.github+json" },
          signal: controller.signal,
          credentials: "omit",
          referrerPolicy: "no-referrer",
        },
      );
      if ([403, 429].includes(response.status)) {
        pauseRequests(response);
        throw new ProfileError(
          response.status === 429 ? "rate-limit" : "forbidden",
        );
      }
      if (!response.ok)
        throw new ProfileError(response.status === 404 ? "not-found" : "http");
      let profile;
      try {
        profile = normalizeProfile(await response.json());
      } catch {
        throw new ProfileError("invalid-response");
      }
      writeCache(key, profile);
      return { profile, error: null, stale: false };
    } finally {
      clearTimeout(timeout);
    }
  }

  async function getProfile(username) {
    const key = text(username).toLowerCase();
    if (!USERNAME_PATTERN.test(key))
      return { profile: null, error: "invalid-username", stale: false };
    const cached = readCache(key);
    if (cached && Date.now() - cached.savedAt < FRESH_TIME) {
      return { profile: cached.profile, error: null, stale: false };
    }
    if (pending.has(key)) return pending.get(key);
    blockedUntil = Math.max(
      blockedUntil,
      Number(readStorage("blocked-until")) || 0,
    );
    const failure = failures.get(key);
    if (blockedUntil > Date.now() || failure?.until > Date.now()) {
      const error = blockedUntil > Date.now() ? "rate-limit" : failure.code;
      return { profile: cached?.profile || null, error, stale: !!cached };
    }
    const request = requestProfile(key)
      .catch((error) => {
        const code = error instanceof ProfileError ? error.code : "network";
        failures.set(key, { code, until: Date.now() + FAILURE_PAUSE });
        return {
          profile: cached?.profile || null,
          error: code,
          stale: !!cached,
        };
      })
      .finally(() => pending.delete(key));
    pending.set(key, request);
    return request;
  }

  window.FocusTeamGitHub = { getProfile, normalizeProfile, safeUrl };
})();
