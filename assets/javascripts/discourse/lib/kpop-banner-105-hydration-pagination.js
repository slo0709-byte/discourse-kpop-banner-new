import {
  chartForPaginationKey,
  paginationKeyForKpoppingPeriod,
} from "./kpop-banner-105-pagination-state.js";
import {
  appendCurrentPagination,
  getPaginationByKey,
  recordSoridataPagination,
  resolveAvailableView,
} from "./kpop-banner-105-data-state.js";
import { getKpopBannerDataUrl } from "./kpop-banner-105-settings.js";
import { fetchSoridataRankingsFromNetwork } from "./kpop-banner-105-source-fetchers.js";

export function getPaginationForCurrentView(instance) {
  if (instance?.currentSource !== "kpopping") {
    return null;
  }

  return getPaginationByKey(
    paginationKeyForKpoppingPeriod(instance.currentPeriod),
  );
}

export async function loadMoreCurrentView(instance, viewController) {
  const key = paginationKeyForKpoppingPeriod(instance?.currentPeriod);
  const pagination = getPaginationByKey(key);
  const chart = chartForPaginationKey(key);
  if (
    !key ||
    !chart ||
    !pagination?.hasMore ||
    pagination.nextOffset === null ||
    pagination.nextOffset === undefined
  ) {
    return false;
  }

  const nextPage = await fetchSoridataRankingsFromNetwork(
    [
      getKpopBannerDataUrl("soridata", {
        chart,
        offset: pagination.nextOffset,
        limit: pagination.limit,
      }),
    ],
    { chart, recordSoridataPagination },
  );
  if (!Array.isArray(nextPage[key]) || !nextPage[key].length) {
    return false;
  }

  appendCurrentPagination(nextPage, key);
  viewController.applyViewAndRender(
    resolveAvailableView(instance.currentSource, instance.currentPeriod),
    { persist: false, resetIndex: false },
  );
  return true;
}
