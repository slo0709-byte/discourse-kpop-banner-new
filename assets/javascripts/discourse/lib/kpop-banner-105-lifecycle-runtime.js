import {
  defaultPeriodForSource,
  kpoppingPeriodOptions,
  normalizeSelectedPeriod,
  normalizeSelectedSource,
} from "./kpop-banner-105-chart-model.js";
import { fireMultipleCannons } from "./kpop-banner-105-confetti.js";
import { createKpopBanner105Storage } from "./kpop-banner-105-storage.js";
import {
  availablePeriods,
  applyCurrentView as applyCurrentViewToState,
  getKpoppingHistoryItems,
  getPeriodLabel,
  getSongsBySource,
  resolveAvailableView,
  resolveKpoppingHistoryView,
} from "./kpop-banner-105-data-state.js";
import {
  bannerDataUpdatedEvent,
  ensureCircleMultiDataAvailable,
  ensureKpoppingDataAvailable,
  getPaginationForCurrentView,
  hydrateSongs,
  hydrateStoredViewData,
  loadMoreCurrentView,
  sourceNeedsCircleMultiData,
} from "./kpop-banner-105-hydration.js";
import {
  deleteBannerCleanup,
  ensureSingleBannerRoot,
  getBannerCleanup,
} from "./kpop-banner-105-instance-lifecycle.js";
import { bindBanner } from "./kpop-banner-105-banner-binding.js";
import { createKpopBanner105LikeState } from "./kpop-banner-105-like-state.js";
import {
  createKpopBanner105AchievementHelpers,
  getCircleHeroMetaHtml,
} from "./kpop-banner-105-achievements.js";
import {
  getReappearMinutes,
  isKpopBannerEnabled,
  setKpopBannerSiteSettings,
} from "./kpop-banner-105-settings.js";

const prefersReducedMotion =
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
const bannerStorage = createKpopBanner105Storage({ kpoppingPeriodOptions });

const likeState = createKpopBanner105LikeState({
  bannerStorage,
  fireMultipleCannons,
  getSongsBySource,
});
const achievementHelpers = createKpopBanner105AchievementHelpers({
  getSongsBySource,
});

function getStoredSource() {
  return bannerStorage.getStoredSource();
}

function setStoredSource(source) {
  bannerStorage.setStoredSource(source);
}

function getStoredPeriod() {
  return bannerStorage.getStoredPeriod();
}

function setStoredPeriod(period) {
  bannerStorage.setStoredPeriod(period);
}

function setBannerStorageScope(userId) {
  bannerStorage.setBannerStorageScope(userId);
}

function setHiddenUntil(timestamp) {
  bannerStorage.setHiddenUntil(timestamp);
}

function clearHiddenUntil() {
  bannerStorage.clearHiddenUntil();
}

function isBannerHiddenNow() {
  const hiddenUntil = bannerStorage.getHiddenUntil();
  if (!hiddenUntil) {
    return false;
  }
  if (Date.now() >= hiddenUntil) {
    clearHiddenUntil();
    return false;
  }
  return true;
}

function applyCurrentView(view, options = {}) {
  applyCurrentViewToState(view, {
    ...options,
    setStoredPeriod,
    setStoredSource,
  });
}

function createBindingContext() {
  return {
    ...achievementHelpers,
    ...likeState,
    applyCurrentView,
    availablePeriods,
    bannerDataUpdatedEvent,
    defaultPeriodForSource,
    ensureCircleMultiDataAvailable,
    ensureKpoppingDataAvailable,
    fireMultipleCannons,
    getCircleHeroMetaHtml,
    getKpoppingHistoryItems,
    getPaginationForCurrentView,
    getPeriodLabel,
    getReappearMinutes,
    getStoredPeriod,
    getStoredSource,
    isBannerHiddenNow,
    loadMoreCurrentView,
    normalizeSelectedPeriod,
    normalizeSelectedSource,
    prefersReducedMotion,
    resolveAvailableView,
    resolveKpoppingHistoryView,
    setHiddenUntil,
    sourceNeedsCircleMultiData,
  };
}

export async function mountKpopBanner(root, hooks = {}) {
  if (!root) {
    return () => {};
  }
  const existingCleanup = getBannerCleanup(root);
  if (typeof existingCleanup === "function") {
    existingCleanup();
  }
  ensureSingleBannerRoot();
  await hydrateSongs();
  await hydrateStoredViewData({ getStoredPeriod, getStoredSource });
  return bindBanner(root, createBindingContext(), hooks) || (() => {});
}

export function unmountKpopBanner(root) {
  if (!root) {
    return;
  }
  const existingCleanup = getBannerCleanup(root);
  if (typeof existingCleanup === "function") {
    existingCleanup();
  }
  deleteBannerCleanup(root);
}

export function configureKpopBanner105(api) {
  setKpopBannerSiteSettings(
    api.container.lookup("service:site-settings") || {},
  );
  if (!isKpopBannerEnabled()) {
    return;
  }

  const currentUser =
    typeof api.getCurrentUser === "function" ? api.getCurrentUser() : null;
  setBannerStorageScope(currentUser?.id || null);
  void hydrateSongs();
  api.onPageChange(() => {
    void hydrateSongs();
  });
}
