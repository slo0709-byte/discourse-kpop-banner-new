import { recordSoridataPagination } from "./kpop-banner-105-data-state.js";
import {
  fetchKpoppingSongsFromNetwork,
  fetchSoridataRankingsFromNetwork,
  fetchUnifiedSongsFromNetwork,
} from "./kpop-banner-105-source-fetchers.js";

export function queueMissingHydrationRefreshes(
  keys,
  caches,
  refreshSourceDataInBackground,
  setPeriodLabel,
  getLastHydratedSignature,
  setLastHydratedSignature,
) {
  if (!caches.unifiedCache.fresh) {
    refreshSourceDataInBackground(
      "unified",
      keys.unifiedBucketKey,
      () => fetchUnifiedSongsFromNetwork(keys.candidates),
      keys.signature,
      getLastHydratedSignature,
      setLastHydratedSignature,
    );
  }
  if (!caches.kpoppingCache.fresh) {
    refreshSourceDataInBackground(
      "kpopping",
      keys.kpoppingBucketKey,
      () => fetchKpoppingSongsFromNetwork(keys.kpoppingCandidates, setPeriodLabel),
      keys.signature,
      getLastHydratedSignature,
      setLastHydratedSignature,
    );
  }
  if (!caches.soridataCache.fresh) {
    refreshSourceDataInBackground(
      "soridata",
      keys.soridataBucketKey,
      () =>
        fetchSoridataRankingsFromNetwork(keys.soridataCandidates, {
          recordSoridataPagination,
        }),
      keys.signature,
      getLastHydratedSignature,
      setLastHydratedSignature,
    );
  }
}
