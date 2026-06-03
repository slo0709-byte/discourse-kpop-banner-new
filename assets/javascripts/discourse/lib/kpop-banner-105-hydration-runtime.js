import {
	defaultPeriodForSource,
	normalizeSelectedPeriod,
	normalizeSelectedSource,
} from "./kpop-banner-105-chart-model.js";
import {
	getCircleMultiBucketKey,
	getIchartBucketKey,
	getKpoppingBucketKey,
	getSoridataBucketKey,
} from "./kpop-banner-105-refresh-buckets.js";
import { chartForPaginationKey } from "./kpop-banner-105-pagination-state.js";
import {
	applyHydratedSongs,
	appendCurrentPagination,
	getCachedSourceData,
	getPaginationByKey,
	getSongsBySource,
	hasAnySongs,
	hasHydratedSongs,
	mergeSongsBySource,
} from "./kpop-banner-105-data-state.js";
import {
	getKpopBannerDataUrl,
	refreshRemoteDataVersions,
	remoteAwareBucketKey,
} from "./kpop-banner-105-data-endpoints.js";
import {
	fetchCircleMultiSongsFromNetwork,
	fetchUnifiedSongsFromNetwork,
} from "./kpop-banner-105-chart-fetchers.js";
import {
	fetchKpoppingSongsFromNetwork,
	fetchSoridataRankingsFromNetwork,
} from "./kpop-banner-105-music-show-fetchers.js";
import {
	refreshSourceData,
	refreshSourceDataInBackground,
} from "./kpop-banner-105-data-refresh.js";

let hydratePromise = null;
let lastHydratedSignature = "";

function getLastHydratedSignature() {
	return lastHydratedSignature;
}

function setLastHydratedSignature(signature) {
	lastHydratedSignature = signature;
}

export function sourceNeedsCircleMultiData(source, period) {
	if (source === "ichart" || source === "kpopping") {
		return false;
	}

	return !(source === "circle-global" && period === "day");
}

export function getPaginationForCurrentView(instance) {
	if (instance?.currentSource !== "kpopping") {
		return null;
	}

	return getPaginationByKey(paginationKeyForInstance(instance));
}

function paginationKeyForInstance(instance) {
	const period = instance?.currentPeriod;
	if (period === "song-wins") {
		return "kpopping-song-wins";
	}
	if (period === "artist-wins") {
		return "kpopping-artist-wins";
	}
	return "";
}

export async function loadMoreCurrentView(instance, viewController, resolveAvailableView) {
	const key = paginationKeyForInstance(instance);
	const pagination = getPaginationByKey(key);
	const chart = chartForPaginationKey(key);
	if (!key || !chart || !pagination?.hasMore || pagination.nextOffset === null || pagination.nextOffset === undefined) {
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
		{ chart },
	);
	if (!Array.isArray(nextPage[key]) || !nextPage[key].length) {
		return false;
	}

	appendCurrentPagination(nextPage, key);
	viewController.applyViewAndRender(resolveAvailableView(instance.currentSource, instance.currentPeriod), {
		persist: false,
		resetIndex: false,
	});
	return true;
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
		refreshSourceDataInBackground("circleMulti", circleBucketKey, () => fetchCircleMultiSongsFromNetwork(), signature, getLastHydratedSignature, setLastHydratedSignature);
		return circleCache.stale;
	}

	const freshCircle = await refreshSourceData("circleMulti", circleBucketKey, () => fetchCircleMultiSongsFromNetwork());
	if (hasAnySongs(freshCircle)) {
		applyHydratedSongs(mergeSongsBySource(getSongsBySource(), freshCircle));
		lastHydratedSignature = signature;
	}

	return freshCircle;
}

export async function ensureKpoppingDataAvailable(periodLabels) {
	const kpoppingCandidates = [getKpopBannerDataUrl("kpopping")];
	const soridataCandidates = [getKpopBannerDataUrl("soridata")];

	await refreshRemoteDataVersions(["kpopping", "soridata"]);
	const kpoppingBucketKey = remoteAwareBucketKey("kpopping", getKpoppingBucketKey());
	const soridataBucketKey = remoteAwareBucketKey("soridata", getSoridataBucketKey());
	const signature = `${getIchartBucketKey()}|${getCircleMultiBucketKey()}|${kpoppingBucketKey}|${soridataBucketKey}`;
	const kpoppingCache = getCachedSourceData("kpopping", kpoppingBucketKey);
	const soridataCache = getCachedSourceData("soridata", soridataBucketKey);

	if (hasAnySongs(kpoppingCache.fresh)) {
		applyHydratedSongs(mergeSongsBySource(getSongsBySource(), kpoppingCache.fresh, soridataCache.fresh || soridataCache.stale));
		lastHydratedSignature = signature;
		return kpoppingCache.fresh;
	}

	if (hasAnySongs(kpoppingCache.stale)) {
		applyHydratedSongs(mergeSongsBySource(getSongsBySource(), kpoppingCache.stale, soridataCache.fresh || soridataCache.stale));
		refreshSourceDataInBackground("kpopping", kpoppingBucketKey, () => fetchKpoppingSongsFromNetwork(kpoppingCandidates, periodLabels), signature, getLastHydratedSignature, setLastHydratedSignature);
		return kpoppingCache.stale;
	}

	const [freshKpopping, freshSoridata] = await Promise.all([
		refreshSourceData("kpopping", kpoppingBucketKey, () => fetchKpoppingSongsFromNetwork(kpoppingCandidates, periodLabels)),
		refreshSourceData("soridata", soridataBucketKey, () => fetchSoridataRankingsFromNetwork(soridataCandidates)),
	]);
	if (hasAnySongs(freshKpopping)) {
		applyHydratedSongs(mergeSongsBySource(getSongsBySource(), freshKpopping, freshSoridata));
		lastHydratedSignature = signature;
	}

	return freshKpopping;
}

export async function hydrateSongs(periodLabels) {
	const candidates = [getKpopBannerDataUrl("unified")];
	const kpoppingCandidates = [getKpopBannerDataUrl("kpopping")];
	const soridataCandidates = [getKpopBannerDataUrl("soridata")];

	await refreshRemoteDataVersions(["unified", "circle", "kpopping", "soridata"]);
	const unifiedBucketKey = remoteAwareBucketKey("unified", getIchartBucketKey());
	const circleBucketKey = remoteAwareBucketKey("circle", getCircleMultiBucketKey());
	const kpoppingBucketKey = remoteAwareBucketKey("kpopping", getKpoppingBucketKey());
	const soridataBucketKey = remoteAwareBucketKey("soridata", getSoridataBucketKey());
	const signature = `${unifiedBucketKey}|${circleBucketKey}|${kpoppingBucketKey}|${soridataBucketKey}`;

	if (hasHydratedSongs(signature, lastHydratedSignature)) {
		return;
	}
	if (hydratePromise) {
		return hydratePromise;
	}

	hydratePromise = (async () => {
		const unifiedCache = getCachedSourceData("unified", unifiedBucketKey);
		const circleCache = getCachedSourceData("circleMulti", circleBucketKey);
		const kpoppingCache = getCachedSourceData("kpopping", kpoppingBucketKey);
		const soridataCache = getCachedSourceData("soridata", soridataBucketKey);
		const cachedMerged = mergeSongsBySource(unifiedCache.fresh || unifiedCache.stale, circleCache.fresh || circleCache.stale, kpoppingCache.fresh || kpoppingCache.stale, soridataCache.fresh || soridataCache.stale);

		if (hasAnySongs(cachedMerged)) {
			applyHydratedSongs(cachedMerged);
			lastHydratedSignature = signature;
			if (!unifiedCache.fresh) {
				refreshSourceDataInBackground("unified", unifiedBucketKey, () => fetchUnifiedSongsFromNetwork(candidates), signature, getLastHydratedSignature, setLastHydratedSignature);
			}
			if (!kpoppingCache.fresh) {
				refreshSourceDataInBackground("kpopping", kpoppingBucketKey, () => fetchKpoppingSongsFromNetwork(kpoppingCandidates, periodLabels), signature, getLastHydratedSignature, setLastHydratedSignature);
			}
			if (!soridataCache.fresh) {
				refreshSourceDataInBackground("soridata", soridataBucketKey, () => fetchSoridataRankingsFromNetwork(soridataCandidates), signature, getLastHydratedSignature, setLastHydratedSignature);
			}
			return;
		}

		const [freshUnified, freshKpopping, freshSoridata] = await Promise.all([
			refreshSourceData("unified", unifiedBucketKey, () => fetchUnifiedSongsFromNetwork(candidates)),
			refreshSourceData("kpopping", kpoppingBucketKey, () => fetchKpoppingSongsFromNetwork(kpoppingCandidates, periodLabels)),
			refreshSourceData("soridata", soridataBucketKey, () => fetchSoridataRankingsFromNetwork(soridataCandidates)),
		]);
		applyHydratedSongs(mergeSongsBySource(freshUnified, circleCache.fresh || circleCache.stale, freshKpopping, freshSoridata));
		lastHydratedSignature = signature;
	})().finally(() => {
		hydratePromise = null;
	});

	return hydratePromise;
}

export async function hydrateStoredViewData({
	getStoredSource,
	getStoredPeriod,
	availablePeriods,
	periodLabels,
}) {
	const storedSource = normalizeSelectedSource(getStoredSource());
	const storedPeriod = normalizeSelectedPeriod(getStoredPeriod(), storedSource);

	if (sourceNeedsCircleMultiData(storedSource, storedPeriod)) {
		await ensureCircleMultiDataAvailable();
	}
	if (storedSource === "kpopping" && !availablePeriods("kpopping").length) {
		await ensureKpoppingDataAvailable(periodLabels);
	}
}

export function defaultView() {
	return {
		source: "ichart",
		period: defaultPeriodForSource("ichart"),
	};
}
