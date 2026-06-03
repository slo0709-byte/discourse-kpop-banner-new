import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  appendPaginatedSongs,
  buildPaginatedCacheKey,
  chartForPaginationKey,
  paginationKeyForKpoppingPeriod,
} from "../assets/javascripts/discourse/lib/kpop-banner-105-pagination-state.js";

describe("pagination state", () => {
  it("appends only new songs after the current page", () => {
    const current = {
      "kpopping-song-wins": [
        { rank: 1, title: "A" },
        { rank: 2, title: "B" },
      ],
    };
    const next = {
      "kpopping-song-wins": [
        { rank: 3, title: "C" },
        { rank: 4, title: "D" },
      ],
    };

    const result = appendPaginatedSongs(current, next, "kpopping-song-wins");

    assert.deepEqual(result["kpopping-song-wins"].map((song) => song.title), ["A", "B", "C", "D"]);
  });

  it("keeps guest and user page caches separate", () => {
    const guestKey = buildPaginatedCacheKey({ source: "soridata", chart: "song", offset: 0, limit: 50, version: "100", userScope: "anon" });
    const userKey = buildPaginatedCacheKey({ source: "soridata", chart: "song", offset: 0, limit: 50, version: "100", userScope: "u7" });
    const secondPageKey = buildPaginatedCacheKey({ source: "soridata", chart: "song", offset: 50, limit: 50, version: "100", userScope: "u7" });

    assert.notEqual(guestKey, userKey);
    assert.notEqual(userKey, secondPageKey);
  });

  it("maps kpopping ranking periods to soridata pagination charts", () => {
    assert.equal(paginationKeyForKpoppingPeriod("song-wins"), "kpopping-song-wins");
    assert.equal(paginationKeyForKpoppingPeriod("artist-wins"), "kpopping-artist-wins");
    assert.equal(chartForPaginationKey("kpopping-song-wins"), "song");
    assert.equal(chartForPaginationKey("kpopping-artist-wins"), "artist");
  });
});
