let kpopBannerSiteSettings = {};
const remoteDataVersionPromises = new Map();
const remoteDataVersions = new Map();

export function configureKpopBannerSettings(settings = {}) {
	kpopBannerSiteSettings = settings || {};
}

export function getConfiguredKpopBannerSettings() {
	return kpopBannerSiteSettings;
}

export function getKpopBannerSetting(name, fallback = "") {
	return kpopBannerSiteSettings?.[name] ?? fallback;
}

export function getKpopBannerDataUrl(source, extraParams = {}) {
	const endpoint = String(
		getKpopBannerSetting("kpop_banner_data_endpoint", "/kpop/banner-data"),
	).trim() || "/kpop/banner-data";
	const url = new URL(endpoint, window.location.origin);
	url.searchParams.set("source", source);
	Object.entries(extraParams).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") {
			url.searchParams.set(key, String(value));
		}
	});
	return `${url.pathname}${url.search}`;
}

async function fetchKpopBannerDataVersion(source) {
	if (remoteDataVersionPromises.has(source)) {
		return remoteDataVersionPromises.get(source);
	}

	const promise = (async () => {
		try {
			const resp = await fetch(getKpopBannerDataUrl(source), {
				method: "HEAD",
				headers: { accept: "application/json" },
				cache: "no-store",
			});
			const version = resp.headers.get("x-kpop-data-mtime");
			if (resp.ok && version) {
				remoteDataVersions.set(source, version);
				return version;
			}
		} catch {
			return null;
		}

		return null;
	})().finally(() => {
		remoteDataVersionPromises.delete(source);
	});

	remoteDataVersionPromises.set(source, promise);
	return promise;
}

export async function refreshRemoteDataVersions(sources) {
	await Promise.all(sources.map((source) => fetchKpopBannerDataVersion(source)));
}

export function remoteAwareBucketKey(source, fallbackBucketKey) {
	const version = remoteDataVersions.get(source);
	return version ? `${source}:${version}` : fallbackBucketKey;
}
