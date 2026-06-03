let kpopBannerSiteSettings = {};

export function setKpopBannerSiteSettings(settings = {}) {
  kpopBannerSiteSettings = settings || {};
}

export function getKpopBannerSetting(name, fallback = "") {
  return kpopBannerSiteSettings?.[name] ?? fallback;
}

export function isKpopBannerEnabled() {
  return (
    !!kpopBannerSiteSettings.kpop_banner_enabled &&
    !!kpopBannerSiteSettings.kpop_banner_ui_enabled
  );
}

export function getKpopBannerDataUrl(source, extraParams = {}) {
  const endpoint =
    String(getKpopBannerSetting("kpop_banner_data_endpoint", "/kpop/banner-data")).trim() ||
    "/kpop/banner-data";
  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set("source", source);
  Object.entries(extraParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return `${url.pathname}${url.search}`;
}

export function getReappearMinutes() {
  const raw = Number(getKpopBannerSetting("kpop_banner_reappear_minutes", 60));
  if (!Number.isFinite(raw) || raw <= 0) {
    return 60;
  }
  return Math.floor(raw);
}
