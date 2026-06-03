import { getCircleMultiBucketKey, getIchartBucketKey, getKpoppingBucketKey, getSoridataBucketKey } from "./kpop-banner-105-refresh-buckets.js";
import { applyHydratedSongs, availablePeriods, getCachedSourceData, getSongsBySource, hasAnySongs, hasHydratedSongs, mergeSongsBySource, recordSoridataPagination, setPeriodLabel } from "./kpop-banner-105-data-state.js";
import { bannerDataUpdatedEvent, refreshSourceData, refreshSourceDataInBackground } from "./kpop-banner-105-data-refresh.js";
import { refreshRemoteDataVersions, remoteAwareBucketKey } from "./kpop-banner-105-remote-versions.js";
import { fetchCircleMultiSongsFromNetwork, fetchKpoppingSongsFromNetwork, fetchSoridataRankingsFromNetwork, fetchUnifiedSongsFromNetwork } from "./kpop-banner-105-source-fetchers.js";
import { normalizeSelectedPeriod, normalizeSelectedSource } from "./kpop-banner-105-chart-model.js";
import { getKpopBannerDataUrl } from "./kpop-banner-105-settings.js";
import { queueMissingHydrationRefreshes } from "./kpop-banner-105-hydration-refresh-queue.js";

export { bannerDataUpdatedEvent };
export { getPaginationForCurrentView, loadMoreCurrentView } from "./kpop-banner-105-hydration-pagination.js";

let hydratePromise = null;
let lastHydratedSignature = "";

export function sourceNeedsCircleMultiData(source, period) {
  if (source === "ichart" || source === "kpopping") {
    return false;
  }

  return !(source === "circle-global" && period === "day");
}

export async function ensureCircleMultiDataAvailable() {
  await refreshRemoteDataVersions(["circle"]);
  const circleBucketKey = remoteAwareBucketKey("circle", getCircleMultiBucketKey());
  const signature = `${getIchartBucketKey()}|${circleBucketKey}`;
  const circleCache = getCachedSourceData("circleMulti", circleBucketKey);

  if (hasAnySongs(circleCache.fresh)) {
    applyHydratedSongs(mergeSongsBySource(getSongsBySource(), circleCache.fresh));
    lastHydratedSignature = signature;
    return circleCache.fresh;
  }

  if (hasAnySongs(circleCache.stale)) {
    applyHydratedSongs(mergeSongsBySource(getSongsBySource(), circleCache.stale));
    refreshSourceDataInBackground(
      "circleMulti",
      circleBucketKey,
      () => fetchCircleMultiSongsFromNetwork(),
      signature,
      () => lastHydratedSignature,
      (nextSignature) => {
        lastHydratedSignature = nextSignature;
      },
    );
    return circleCache.stale;
  }

  const freshCircle = await refreshSourceData(
    "circleMulti",
    circleBucketKey,
    () => fetchCircleMultiSongsFromNetwork(),
  );
  if (hasAnySongs(freshCircle)) {
    applyHydratedSongs(mergeSongsBySource(getSongsBySource(), freshCircle));
    lastHydratedSignature = signature;
  }

  return freshCircle;
}

export async function ensureKpoppingDataAvailable() {
  const kpoppingCandidates = [getKpopBannerDataUrl("kpopping")];
  const soridataCandidates = [getKpopBannerDataUrl("soridata")];
  await refreshRemoteDataVersions(["kpopping", "soridata"]);
  const kpoppingBucketKey = remoteAwareBucketKey("kpopping", getKpoppingBucketKey());
  const soridataBucketKey = remoteAwareBucketKey("soridata", getSoridataBucketKey());
  const signature = `${getIchartBucketKey()}|${getCircleMultiBucketKey()}|${kpoppingBucketKey}|${soridataBucketKey}`;
  const kpoppingCache = getCachedSourceData("kpopping", kpoppingBucketKey);
  const soridataCache = getCachedSourceData("soridata", soridataBucketKey);

  if (hasAnySongs(kpoppingCache.fresh) || hasAnySongs(kpoppingCache.stale)) {
    const kpoppingData = hasAnySongs(kpoppingCache.fresh)
      ? kpoppingCache.fresh
      : kpoppingCache.stale;
    applyHydratedSongs(
      mergeSongsBySource(
        getSongsBySource(),
        kpoppingData,
        soridataCache.fresh || soridataCache.stale,
      ),
    );
    lastHydratedSignature = signature;
    if (!hasAnySongs(kpoppingCache.fresh)) {
      refreshSourceDataInBackground(
        "kpopping",
        kpoppingBucketKey,
        () => fetchKpoppingSongsFromNetwork(kpoppingCandidates, setPeriodLabel),
        signature,
        () => lastHydratedSignature,
        (nextSignature) => {
          lastHydratedSignature = nextSignature;
        },
      );
    }
    return kpoppingData;
  }

  const [freshKpopping, freshSoridata] = await Promise.all([
    refreshSourceData("kpopping", kpoppingBucketKey, () =>
      fetchKpoppingSongsFromNetwork(kpoppingCandidates, setPeriodLabel),
    ),
    refreshSourceData("soridata", soridataBucketKey, () =>
      fetchSoridataRankingsFromNetwork(soridataCandidates, {
        recordSoridataPagination,
      }),
    ),
  ]);
  if (hasAnySongs(freshKpopping)) {
    applyHydratedSongs(mergeSongsBySource(getSongsBySource(), freshKpopping, freshSoridata));
    lastHydratedSignature = signature;
  }

  return freshKpopping;
}

export async function hydrateSongs() {
  const candidates = [getKpopBannerDataUrl("unified")];
  const kpoppingCandidates = [getKpopBannerDataUrl("kpopping")];
  const soridataCandidates = [getKpopBannerDataUrl("soridata")];
  await refreshRemoteDataVersions(["unified", "circle", "kpopping", "soridata"]);
  const unifiedBucketKey = remoteAwareBucketKey("unified", getIchartBucketKey());
  const circleBucketKey = remoteAwareBucketKey("circle", getCircleMultiBucketKey());
  const kpoppingBucketKey = remoteAwareBucketKey("kpopping", getKpoppingBucketKey());
  const soridataBucketKey = remoteAwareBucketKey("soridata", getSoridataBucketKey());
  const signature = `${unifiedBucketKey}|${circleBucketKey}|${kpoppingBucketKey}|${soridataBucketKey}`;

  if (hasHydratedSongs() && lastHydratedSignature === signature) {
    return;
  }
  if (hydratePromise) {
    return hydratePromise;
  }

  hydratePromise = hydrateSongsOnce({
    candidates,
    circleBucketKey,
    kpoppingBucketKey,
    kpoppingCandidates,
    signature,
    soridataBucketKey,
    soridataCandidates,
    unifiedBucketKey,
  }).finally(() => {
    hydratePromise = null;
  });
  return hydratePromise;
}

async function hydrateSongsOnce(keys) {
  const unifiedCache = getCachedSourceData("unified", keys.unifiedBucketKey);
  const circleCache = getCachedSourceData("circleMulti", keys.circleBucketKey);
  const kpoppingCache = getCachedSourceData("kpopping", keys.kpoppingBucketKey);
  const soridataCache = getCachedSourceData("soridata", keys.soridataBucketKey);
  const cachedMerged = mergeSongsBySource(
    unifiedCache.fresh || unifiedCache.stale,
    circleCache.fresh || circleCache.stale,
    kpoppingCache.fresh || kpoppingCache.stale,
    soridataCache.fresh || soridataCache.stale,
  );

  if (hasAnySongs(cachedMerged)) {
    applyHydratedSongs(cachedMerged);
    lastHydratedSignature = keys.signature;
    queueMissingHydrationRefreshes(
      keys,
      { unifiedCache, kpoppingCache, soridataCache },
      refreshSourceDataInBackground,
      setPeriodLabel,
      () => lastHydratedSignature,
      (nextSignature) => {
        lastHydratedSignature = nextSignature;
      },
    );
    return;
  }

  const [freshUnified, freshKpopping, freshSoridata] = await Promise.all([
    refreshSourceData("unified", keys.unifiedBucketKey, () =>
      fetchUnifiedSongsFromNetwork(keys.candidates),
    ),
    refreshSourceData("kpopping", keys.kpoppingBucketKey, () =>
      fetchKpoppingSongsFromNetwork(keys.kpoppingCandidates, setPeriodLabel),
    ),
    refreshSourceData("soridata", keys.soridataBucketKey, () =>
      fetchSoridataRankingsFromNetwork(keys.soridataCandidates, {
        recordSoridataPagination,
      }),
    ),
  ]);
  applyHydratedSongs(
    mergeSongsBySource(freshUnified, circleCache.fresh || circleCache.stale, freshKpopping, freshSoridata),
  );
  lastHydratedSignature = keys.signature;
}

export async function hydrateStoredViewData({ getStoredPeriod, getStoredSource }) {
  const storedSource = normalizeSelectedSource(getStoredSource());
  const storedPeriod = normalizeSelectedPeriod(getStoredPeriod(), storedSource);

  if (sourceNeedsCircleMultiData(storedSource, storedPeriod)) {
    await ensureCircleMultiDataAvailable();
  }
  if (storedSource === "kpopping" && !availablePeriods("kpopping").length) {
    await ensureKpoppingDataAvailable();
  }
}
