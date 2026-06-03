import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readFileSync } from "node:fs";

import {
  createEmptySongsBySource,
  defaultPeriodForSource,
  normalizeSelectedPeriod,
  normalizeSelectedSource,
  resolveAvailableView,
} from "../assets/javascripts/discourse/lib/kpop-banner-105-chart-model.js";
import { createKpopBanner105Storage } from "../assets/javascripts/discourse/lib/kpop-banner-105-storage.js";

function installLocalStorage() {
  const values = new Map();
  const localStorage = {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
  globalThis.window = { localStorage };
  globalThis.localStorage = localStorage;
}

describe("lifecycle contract", () => {
  beforeEach(() => {
    installLocalStorage();
  });

  it("keeps the default banner view on iChart day", () => {
    const songsBySource = createEmptySongsBySource();
    songsBySource["ichart-day"] = [{ title: "A", artist: "B" }];

    const view = resolveAvailableView(songsBySource, "ichart", "day");

    assert.equal(defaultPeriodForSource("ichart"), "day");
    assert.equal(normalizeSelectedSource("unknown"), "ichart");
    assert.equal(normalizeSelectedPeriod("unknown", "ichart"), "day");
    assert.equal(view.source, "ichart");
    assert.equal(view.period, "day");
    assert.equal(view.songs[0].title, "A");
  });

  it("preserves current storage key scoping through the existing storage helper", () => {
    const storage = createKpopBanner105Storage({ kpoppingPeriodOptions: ["stages"] });

    storage.setBannerStorageScope(7);
    storage.setStoredSource("kpopping");
    storage.setStoredPeriod("stages");
    storage.setHiddenUntil(123);
    storage.writeLikeCelebrationState({ song: { liked: true } });

    storage.setBannerStorageScope(8);
    assert.equal(storage.getStoredSource(), "kpopping");
    assert.equal(storage.getStoredPeriod(), "stages");
    assert.equal(storage.getHiddenUntil(), 0);
    assert.deepEqual(storage.readLikeCelebrationState(), {});

    storage.setBannerStorageScope(7);
    assert.equal(storage.getStoredSource(), "kpopping");
    assert.equal(storage.getStoredPeriod(), "stages");
    assert.equal(storage.getHiddenUntil(), 123);
    assert.deepEqual(storage.readLikeCelebrationState(), { song: { liked: true } });
  });

  it("keeps the public mount and unmount API available from the initializer and runtime", () => {
    const initializerSource = readFileSync(
      "assets/javascripts/discourse/initializers/kpop-banner.js",
      "utf8",
    );
    const runtimeSource = readFileSync(
      "assets/javascripts/discourse/lib/kpop-banner-105-lifecycle-runtime.js",
      "utf8",
    );
    assert.match(
      initializerSource,
      /export\s*\{\s*mountKpopBanner\s*,\s*unmountKpopBanner\s*\}/,
    );
    assert.match(runtimeSource, /\bmountKpopBanner\b/);
    assert.match(runtimeSource, /\bunmountKpopBanner\b/);
    assert.match(
      runtimeSource,
      /export\s+async\s+function\s+mountKpopBanner\s*\(/,
    );
    assert.match(
      runtimeSource,
      /export\s+function\s+unmountKpopBanner\s*\(/,
    );
  });
});
