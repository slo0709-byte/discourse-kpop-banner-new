import {
	availablePeriods as getAvailablePeriods,
	createEmptySongsBySource,
	createPeriodLabels,
	defaultPeriodForSource,
	getPeriodLabel as getChartPeriodLabel,
	resolveAvailableView as getResolvedAvailableView,
} from "./kpop-banner-105-chart-model.js";
import { createKpopBanner105DataCache } from "./kpop-banner-105-data-cache.js";
import { appendPaginatedSongs } from "./kpop-banner-105-pagination-state.js";

let songsBySource = createEmptySongsBySource();
let hydrated = false;
let kpoppingHistoryEpisodes = [];
let bannerDataCache = null;
const periodLabels = createPeriodLabels();
const paginationBySourceKey = new Map();

function normalizeImageLookupText(value) {
	return String(value || "")
		.toLowerCase()
		.replace(/\s+/g, " ")
		.trim();
}

function hydrateMusicShowRankImages(nextSongsBySource) {
	const songImageMap = new Map();
	const artistImageMap = new Map();

	Object.entries(nextSongsBySource || {}).forEach(([key, songs]) => {
		if (key === "kpopping-song-wins" || key === "kpopping-artist-wins" || !Array.isArray(songs)) {
			return;
		}

		songs.forEach((song) => {
			const imageUrl = String(song?.imageUrl || "").trim();
			const artist = normalizeImageLookupText(song?.artist);
			const title = normalizeImageLookupText(song?.title);
			if (!imageUrl || !artist) {
				return;
			}

			if (title && !songImageMap.has(`${artist}|||${title}`)) {
				songImageMap.set(`${artist}|||${title}`, imageUrl);
			}
			if (!artistImageMap.has(artist)) {
				artistImageMap.set(artist, imageUrl);
			}
		});
	});

	["kpopping-song-wins", "kpopping-artist-wins"].forEach((key) => {
		if (!Array.isArray(nextSongsBySource?.[key])) {
			return;
		}

		nextSongsBySource[key] = nextSongsBySource[key].map((song) => {
			if (song?.imageUrl) {
				return song;
			}

			const artist = normalizeImageLookupText(song?.artist);
			const title = normalizeImageLookupText(song?.title);
			const imageUrl = key === "kpopping-song-wins"
				? songImageMap.get(`${artist}|||${title}`) || artistImageMap.get(artist) || ""
				: artistImageMap.get(title) || artistImageMap.get(artist) || "";

			return imageUrl ? { ...song, imageUrl } : song;
		});
	});

	return nextSongsBySource;
}

export function cloneSongsBySource(input) {
	const next = createEmptySongsBySource();
	Object.keys(next).forEach((key) => {
		next[key] = Array.isArray(input?.[key]) ? input[key] : [];
	});
	return next;
}

export function getSongsBySource() {
	return songsBySource;
}

export function hasHydratedSongs(signature = null, lastHydratedSignature = null) {
	if (signature === null) {
		return hydrated && hasAnySongs(songsBySource);
	}
	return hydrated && hasAnySongs(songsBySource) && lastHydratedSignature === signature;
}

export function applyHydratedSongs(nextSongsBySource) {
	songsBySource = cloneSongsBySource(hydrateMusicShowRankImages(nextSongsBySource));
	kpoppingHistoryEpisodes = Array.isArray(songsBySource["kpopping-history"])
		? songsBySource["kpopping-history"]
		: [];
	hydrated = true;
}

export function getKpoppingHistoryItems() {
	return Array.isArray(kpoppingHistoryEpisodes) ? kpoppingHistoryEpisodes : [];
}

export function setPeriodLabel(period, label) {
	periodLabels.set(period, label);
}

export function getPeriodLabel(period) {
	return getChartPeriodLabel(period, periodLabels);
}

export function availablePeriods(mainSource) {
	return getAvailablePeriods(songsBySource, mainSource);
}

export function resolveAvailableView(source, period) {
	return getResolvedAvailableView(songsBySource, source, period);
}

export function applyCurrentView(view, options = {}) {
	const instance = options.instance;
	if (!instance) {
		return;
	}

	instance.currentSource = view?.source || "ichart";
	instance.currentPeriod =
		view?.period || defaultPeriodForSource(instance.currentSource);
	instance.allSongs = Array.isArray(view?.songs) ? view.songs : [];

	if (options.persist) {
		options.setStoredSource?.(instance.currentSource);
		options.setStoredPeriod?.(instance.currentPeriod);
	}
}

export function resolveKpoppingHistoryView(period) {
	const songs = songsBySource[`kpopping-${period}`] || [];
	const historyItem = getKpoppingHistoryItems().find(
		(item) => item?.period === period,
	);
	if (historyItem?.title) {
		setPeriodLabel(period, `📺 往期节目: ${historyItem.title}`);
	}
	return songs.length ? { source: "kpopping", period, songs } : null;
}

export function hasAnySongs(input) {
	return Object.values(input || {}).some(
		(items) => Array.isArray(items) && items.length,
	);
}

function getBannerDataCache() {
	if (!bannerDataCache) {
		bannerDataCache = createKpopBanner105DataCache({ cloneSongsBySource });
	}

	return bannerDataCache;
}

export function readCachePayload(kind) {
	return getBannerDataCache().readCachePayload(kind);
}

export function writeCachePayload(kind, bucketKey, data) {
	getBannerDataCache().writeCachePayload(kind, bucketKey, data);
}

export function getCachedSourceData(kind, bucketKey) {
	return getBannerDataCache().getCachedSourceData(kind, bucketKey);
}

export function mergeSongsBySource(...sources) {
	const next = createEmptySongsBySource();
	const preferLongerKeys = new Set(["kpopping-song-wins", "kpopping-artist-wins"]);

	sources.forEach((source) => {
		if (!source) {
			return;
		}

		Object.keys(next).forEach((key) => {
			if (Array.isArray(source[key]) && source[key].length) {
				if (preferLongerKeys.has(key) && next[key].length > source[key].length) {
					return;
				}
				next[key] = source[key];
			}
		});
	});

	return next;
}

export function recordSoridataPagination(summary, chart = "") {
	const pagination = summary?.pagination;
	if (!pagination) {
		return;
	}

	if (pagination.songWins) {
		paginationBySourceKey.set("kpopping-song-wins", pagination.songWins);
	}
	if (pagination.artistWins) {
		paginationBySourceKey.set("kpopping-artist-wins", pagination.artistWins);
	}
	if (pagination.hasMore !== undefined && chart) {
		const key = chart === "artist" ? "kpopping-artist-wins" : "kpopping-song-wins";
		paginationBySourceKey.set(key, pagination);
	}
}

export function getPaginationByKey(key) {
	return key ? paginationBySourceKey.get(key) || null : null;
}

export function appendCurrentPagination(nextPage, key) {
	applyHydratedSongs(appendPaginatedSongs(songsBySource, nextPage, key));
}
