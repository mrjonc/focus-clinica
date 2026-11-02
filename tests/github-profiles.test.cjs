const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const source = fs.readFileSync(
  path.join(root, "src/js/github-profiles.js"),
  "utf8",
);
const PREFIX = "focus:github-profile:v2:";

function setup(fetch, options = {}) {
  const storage = options.storage || new Map();
  const context = vm.createContext({
    window: {},
    fetch,
    URL,
    AbortController,
    setTimeout,
    clearTimeout,
    document: { baseURI: "https://focus.example/" },
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
    },
    ...options.globals,
  });
  vm.runInContext(source, context);
  return { api: context.window.FocusTeamGitHub, storage };
}

const response = (status, body, headers = {}) => ({
  ok: status === 200,
  status,
  headers: { get: (key) => headers[key] || null },
  json: async () => body,
});

test("normalizes only displayed fields with username fallback and safe avatar URL", () => {
  const { api } = setup();
  const profile = api.normalizeProfile({
    login: "alice",
    name: null,
    bio: " ",
    avatar_url: "javascript:alert(1)",
    company: "Private",
    followers: 10,
  });
  assert.deepEqual(Object.keys(profile).sort(), ["github", "name", "photo"]);
  assert.equal(profile.name, "alice");
  assert.equal(profile.photo, null);
  assert.equal(profile.github, "https://github.com/alice");
  assert.equal(
    api.normalizeProfile({
      login: "alice",
      avatar_url: "https://avatars.githubusercontent.com/u/1",
    }).photo,
    "https://avatars.githubusercontent.com/u/1",
  );
});

test("rejects unsafe links and permits relative local photos", () => {
  const { api } = setup();
  const hosts = ["linkedin.com", "www.linkedin.com"];
  for (const value of [
    "javascript:alert(1)",
    "https://linkedin.com.evil.test/in/a",
    "https://me@linkedin.com/in/a",
    "http://linkedin.com/in/a",
  ]) {
    assert.equal(api.safeUrl(value, { hosts }), null);
  }
  assert.equal(
    api.safeUrl("https://www.linkedin.com/in/a/", { hosts }),
    "https://www.linkedin.com/in/a/",
  );
  assert.equal(
    api.safeUrl("assets/photo.jpg", { allowLocal: true }),
    "https://focus.example/assets/photo.jpg",
  );
});

test("shares concurrent requests and caches across page loads", async () => {
  let calls = 0;
  const fetch = async () => {
    calls++;
    return response(200, { login: "alice", name: "Alice" });
  };
  const first = setup(fetch);
  const results = await Promise.all([
    first.api.getProfile("Alice"),
    first.api.getProfile("alice"),
  ]);
  assert.equal(calls, 1);
  assert.equal(results[0].profile.name, "Alice");
  await first.api.getProfile("alice");
  const second = setup(fetch, { storage: first.storage });
  await second.api.getProfile("alice");
  assert.equal(calls, 1);
});

test("404 does not affect other members and is not immediately retried", async () => {
  let calls = 0;
  const { api } = setup(async (url) => {
    calls++;
    return url.endsWith("/missing")
      ? response(404)
      : response(200, { login: "alice" });
  });
  const [missing, alice] = await Promise.all([
    api.getProfile("missing"),
    api.getProfile("alice"),
  ]);
  assert.equal(missing.error, "not-found");
  assert.equal(alice.profile.name, "alice");
  await api.getProfile("missing");
  assert.equal(calls, 2);
});

test("keeps a persistent profile in memory after its first read", async () => {
  const stored = JSON.stringify({
    savedAt: Date.now(),
    profile: { name: "Alice", photo: null, github: "https://github.com/alice" },
  });
  let reads = 0;
  const { api } = setup(async () => assert.fail("Fresh cache must not fetch"), {
    globals: {
      localStorage: {
        getItem() {
          reads++;
          return stored;
        },
        setItem() {
          assert.fail("Reading fresh cache must not rewrite it");
        },
      },
    },
  });
  assert.equal((await api.getProfile("alice")).profile.name, "Alice");
  assert.equal((await api.getProfile("alice")).profile.name, "Alice");
  assert.equal(reads, 1);
});

for (const [status, error] of [
  [403, "forbidden"],
  [429, "rate-limit"],
]) {
  test(`handles ${status} and persists the rate-limit pause`, async () => {
    let calls = 0;
    const fetch = async () => {
      calls++;
      return response(status, null, { "retry-after": "120" });
    };
    const first = setup(fetch);
    assert.equal((await first.api.getProfile("alice")).error, error);
    assert.equal((await first.api.getProfile("bob")).error, "rate-limit");
    const second = setup(fetch, { storage: first.storage });
    assert.equal((await second.api.getProfile("bob")).error, "rate-limit");
    assert.equal(calls, 1);
    assert.ok(
      Number(first.storage.get(PREFIX + "blocked-until")) >=
        Date.now() + 119000,
    );
  });
}

test("honors rate-limit reset when remaining requests are zero", async () => {
  const reset = Math.ceil(Date.now() / 1000) + 3600;
  const { api, storage } = setup(async () =>
    response(403, null, {
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": String(reset),
    }),
  );
  await api.getProfile("alice");
  assert.equal(Number(storage.get(PREFIX + "blocked-until")), reset * 1000);
});

test("revalidates stale data and preserves the last valid profile offline", async () => {
  let online = false;
  const { api, storage } = setup(async () => {
    if (!online) throw new Error("offline");
    return response(200, { login: "bob", name: "Updated" });
  });
  for (const key of ["alice", "bob"])
    storage.set(
      PREFIX + key,
      JSON.stringify({
        savedAt: Date.now() - 7200000,
        profile: {
          name: "Cached",
          photo: null,
          github: `https://github.com/${key}`,
        },
      }),
    );
  const offline = await api.getProfile("alice");
  assert.equal(offline.profile.name, "Cached");
  assert.equal(offline.stale, true);
  assert.equal(offline.error, "network");
  online = true;
  const updated = await api.getProfile("bob");
  assert.equal(updated.profile.name, "Updated");
  assert.equal(updated.stale, false);
});

test("ignores corrupt and expired caches", async () => {
  let calls = 0;
  const { api, storage } = setup(async () => {
    calls++;
    return response(200, { login: "alice" });
  });
  storage.set(PREFIX + "alice", "{broken");
  storage.set(
    PREFIX + "bob",
    JSON.stringify({
      savedAt: Date.now() - 8 * 86400000,
      profile: { name: "Old", github: "https://github.com/bob" },
    }),
  );
  await api.getProfile("alice");
  await api.getProfile("bob");
  assert.equal(calls, 2);
});

test("works with blocked localStorage and retains an in-memory cache", async () => {
  let calls = 0;
  const { api } = setup(
    async () => {
      calls++;
      return response(200, { login: "alice" });
    },
    {
      globals: {
        localStorage: {
          getItem() {
            throw new Error();
          },
          setItem() {
            throw new Error();
          },
        },
      },
    },
  );
  await api.getProfile("alice");
  await api.getProfile("alice");
  assert.equal(calls, 1);
});

test("rejects invalid users, malformed JSON, invalid shapes and server errors", async () => {
  for (const body of [null, {}, { login: "../alice" }]) {
    const { api } = setup(async () => response(200, body));
    assert.equal((await api.getProfile("alice")).error, "invalid-response");
  }
  const { api } = setup(async () => ({
    ...response(200),
    json: async () => {
      throw new SyntaxError();
    },
  }));
  assert.equal((await api.getProfile("alice")).error, "invalid-response");
  assert.equal((await api.getProfile("../alice")).error, "invalid-username");
  assert.equal(
    (await setup(async () => response(500)).api.getProfile("alice")).error,
    "http",
  );
});

test("aborts requests that exceed the deadline", async () => {
  const { api } = setup(
    (url, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => reject(new Error("aborted")), {
          once: true,
        });
      }),
    { globals: { setTimeout: (callback) => setTimeout(callback, 1) } },
  );
  assert.equal((await api.getProfile("alice")).error, "network");
});
