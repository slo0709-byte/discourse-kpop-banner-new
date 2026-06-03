import { getKpopBannerDataUrl } from "./kpop-banner-105-settings.js";

const remoteDataVersionPromises = new Map();
const remoteDataVersions = new Map();

export async function fetchKpopBannerDataVersion(source) {
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
