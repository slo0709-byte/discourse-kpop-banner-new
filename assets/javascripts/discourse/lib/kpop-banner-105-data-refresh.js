import {
	applyHydratedSongs,
	cloneSongsBySource,
	hasAnySongs,
	mergeSongsBySource,
	readCachePayload,
	writeCachePayload,
} from "./kpop-banner-105-data-state.js";

const sourceRefreshPromises = new Map();
const bannerDataUpdatedEvent = "kpop-banner:data-updated";

export { bannerDataUpdatedEvent };

export async function refreshSourceData(kind, bucketKey, fetcher) {
	const promiseKey = `${kind}:${bucketKey}`;
	if (sourceRefreshPromises.has(promiseKey)) {
		return sourceRefreshPromises.get(promiseKey);
	}

	const promise = (async () => {
		const data = await fetcher();
		if (hasAnySongs(data)) {
			writeCachePayload(kind, bucketKey, data);
			return cloneSongsBySource(data);
		}

		const cached = readCachePayload(kind);
		return cloneSongsBySource(cached?.data);
	})().finally(() => {
		sourceRefreshPromises.delete(promiseKey);
	});

	sourceRefreshPromises.set(promiseKey, promise);
	return promise;
}

export function dispatchBannerDataUpdated(signature) {
	if (typeof window === "undefined") {
		return;
	}

	window.dispatchEvent(
		new CustomEvent(bannerDataUpdatedEvent, {
			detail: { signature },
		}),
	);
}

export function refreshRenderedSongsFromCache(signature, lastHydratedSignature) {
	const merged = mergeSongsBySource(
		readCachePayload("unified")?.data,
		readCachePayload("circleMulti")?.data,
		readCachePayload("kpopping")?.data,
		readCachePayload("soridata")?.data,
	);

	if (!hasAnySongs(merged)) {
		return lastHydratedSignature;
	}

	applyHydratedSongs(merged);
	const nextSignature = signature || lastHydratedSignature;
	dispatchBannerDataUpdated(nextSignature);
	return nextSignature;
}

export function refreshSourceDataInBackground(
	kind,
	bucketKey,
	fetcher,
	signature,
	getLastHydratedSignature,
	setLastHydratedSignature,
) {
	void refreshSourceData(kind, bucketKey, fetcher)
		.then(() => {
			setLastHydratedSignature(
				refreshRenderedSongsFromCache(signature, getLastHydratedSignature()),
			);
		})
		.catch(() => {});
}
