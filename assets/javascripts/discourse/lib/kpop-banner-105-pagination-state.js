export function appendPaginatedSongs(current, nextPage, key) {
  const currentItems = Array.isArray(current?.[key]) ? current[key] : [];
  const nextItems = Array.isArray(nextPage?.[key]) ? nextPage[key] : [];
  return {
    ...(current || {}),
    [key]: [...currentItems, ...nextItems],
  };
}

export function paginationKeyForKpoppingPeriod(period) {
  if (period === "song-wins") {
    return "kpopping-song-wins";
  }
  if (period === "artist-wins") {
    return "kpopping-artist-wins";
  }
  return "";
}

export function chartForPaginationKey(key) {
  if (key === "kpopping-song-wins") {
    return "song";
  }
  if (key === "kpopping-artist-wins") {
    return "artist";
  }
  return "";
}

export function buildPaginatedCacheKey({
  source,
  chart = "",
  offset = 0,
  limit = 0,
  version = "",
  userScope = "anon",
}) {
  return [
    "kpop-banner-page",
    userScope || "anon",
    source || "",
    chart || "",
    Number(offset) || 0,
    Number(limit) || 0,
    version || "",
  ].join(":");
}
