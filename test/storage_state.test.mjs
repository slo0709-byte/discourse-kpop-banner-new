import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createKpopBanner105Storage } from "../assets/javascripts/discourse/lib/kpop-banner-105-storage.js";

function installLocalStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  globalThis.window = {
    localStorage: {
      getItem(key) {
        return store.has(key) ? store.get(key) : null;
      },
      setItem(key, value) {
        store.set(key, String(value));
      },
      removeItem(key) {
        store.delete(key);
      },
    },
  };
  return store;
}

describe("kpop banner storage state", () => {
  beforeEach(() => {
    installLocalStorage();
  });

  afterEach(() => {
    delete globalThis.window;
  });

  it("keeps the default view on iChart day", () => {
    const storage = createKpopBanner105Storage();

    assert.equal(storage.getStoredSource(), "ichart");
    assert.equal(storage.getStoredPeriod(), "day");
  });

  it("normalizes malformed stored source and period back to the default view", () => {
    installLocalStorage({
      kpop_banner_chart_source_v1: "javascript:alert(1)",
      kpop_banner_chart_period_v1: "<script>",
    });
    const storage = createKpopBanner105Storage();

    assert.equal(storage.getStoredSource(), "ichart");
    assert.equal(storage.getStoredPeriod(), "day");
  });

  it("preserves chart source and period storage key semantics", () => {
    const store = installLocalStorage();
    const storage = createKpopBanner105Storage();

    storage.setStoredSource("circle-global");
    storage.setStoredPeriod("week");

    assert.equal(store.get("kpop_banner_chart_source_v1"), "circle-global");
    assert.equal(store.get("kpop_banner_chart_period_v1"), "week");
  });

  it("scopes hidden and like state keys by user id", () => {
    const store = installLocalStorage();
    const storage = createKpopBanner105Storage();

    storage.setBannerStorageScope(7);
    storage.setHiddenUntil(12345);
    storage.writeLikeCelebrationState({
      "song|artist": { activeTopRun: true, celebrated: false, liked: true },
    });

    assert.equal(store.get("kpop_banner_hidden_until_v2:u7"), "12345");
    assert.match(store.get("kpop_banner_like_celebration_v1:u7"), /"liked":true/);
  });

  it("treats malformed liked-state JSON as empty state", () => {
    installLocalStorage({
      "kpop_banner_like_celebration_v1:anon": "{",
    });
    const storage = createKpopBanner105Storage();

    assert.deepEqual(storage.readLikeCelebrationState(), {});
  });
});
