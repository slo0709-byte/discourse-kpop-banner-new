import { createKpopBanner105InteractionController } from "./kpop-banner-105-interaction-controller.js";
import {
  buildCircleModalTableHtml,
  buildIchartModalTableHtml,
  buildMusicShowModalTableHtml,
  buildMusicShowRankModalTableHtml,
} from "./kpop-banner-105-modal-content.js";
import { createKpopBanner105RenderController } from "./kpop-banner-105-render-controller.js";
import {
  buildMvSearchUrl,
  getCountBadgeHtml,
  getModalPlaceholderRowHtml,
  getPlatformPillsHtml,
} from "./kpop-banner-105-render-utils.js";
import { createKpopBanner105ViewController } from "./kpop-banner-105-view-controller.js";
import { createBannerInstance, setBannerCleanup } from "./kpop-banner-105-instance-lifecycle.js";
import { applyBannerLayoutStyles, setImageSource } from "./kpop-banner-105-dom-style.js";
import {
  collectBannerElements,
  hasRequiredBannerElements,
} from "./kpop-banner-105-banner-elements.js";
import { renderLoadingState } from "./kpop-banner-105-loading-state.js";
import { bindBannerEvents } from "./kpop-banner-105-banner-events.js";

function hookOrNoop(hooks, name) {
  return typeof hooks[name] === "function" ? hooks[name] : () => {};
}

export function bindBanner(root, context, hooks = {}) {
  if (!root) {
    return undefined;
  }
  if (context.isBannerHiddenNow()) {
    root.dataset.kpopHidden = "1";
    return undefined;
  }
  if (root.dataset.kpopHidden === "1") {
    root.dataset.kpopHidden = "0";
  }
  if (root.dataset.kpopBound === "1") {
    return undefined;
  }

  const instance = createBannerInstance(root);
  const elements = collectBannerElements(root);
  if (!hasRequiredBannerElements(elements)) {
    return undefined;
  }

  applyBannerLayoutStyles(elements);
  const hookState = {
    registerLoadMoreSidebar: hookOrNoop(hooks, "registerLoadMoreSidebar"),
    setHeroState: hookOrNoop(hooks, "setHeroState"),
    setHistoryState: hookOrNoop(hooks, "setHistoryState"),
    setModalState: hookOrNoop(hooks, "setModalState"),
    setPaginationState: hookOrNoop(hooks, "setPaginationState"),
    setSidebarState: hookOrNoop(hooks, "setSidebarState"),
  };

  const renderController = createRenderController({
    context,
    elements,
    hookState,
    instance,
  });
  const viewController = createViewController({
    context,
    elements,
    hookState,
    instance,
    renderController,
    root,
  });
  hookState.registerLoadMoreSidebar(() =>
    context.loadMoreCurrentView(instance, viewController),
  );

  viewController.seedInstanceView();
  if (!instance.allSongs.length) {
    renderLoadingState({
      elements,
      root,
      setHeroState: hookState.setHeroState,
      setModalState: hookState.setModalState,
      setSidebarState: hookState.setSidebarState,
      viewController,
    });
    return undefined;
  }

  root.dataset.kpopLoading = "0";
  elements.openModalBtn.disabled = false;
  if (elements.modal.parentElement !== document.body) {
    document.body.appendChild(elements.modal);
  }
  if (elements.historyModal.parentElement !== document.body) {
    document.body.appendChild(elements.historyModal);
  }

  const interactionController = createInteractionController({
    context,
    elements,
    hookState,
    instance,
    root,
    viewController,
  });
  const cleanup = bindBannerEvents({
    bannerDataUpdatedEvent: context.bannerDataUpdatedEvent,
    elements,
    interactionController,
    root,
    viewController,
  });

  viewController.renderCurrentSelection();
  root.style.display = "";
  root.dataset.kpopBound = "1";
  setBannerCleanup(root, cleanup);
  return cleanup;
}

function createRenderController({ context, elements, hookState, instance }) {
  return createKpopBanner105RenderController({
    instance,
    sidebar: elements.sidebar,
    heroTitle: elements.heroTitle,
    heroArtist: elements.heroArtist,
    heroPoints: elements.heroPoints,
    heroCover: elements.heroCover,
    heroRank: elements.heroRank,
    heroCoverLink: elements.heroCoverLink,
    heroLeft: elements.heroLeft,
    heroMain: elements.heroMain,
    heroCenter: elements.heroCenter,
    heroRight: elements.heroRight,
    heroPointsLabel: elements.heroPointsLabel,
    heroStatusWrap: elements.heroStatusWrap,
    heroExtraInfo: elements.heroExtraInfo,
    heroCoverBadgeContainer: elements.heroCoverBadgeContainer,
    confettiBtn: elements.confettiBtn,
    likeIcon: elements.likeIcon,
    prefersReducedMotion: context.prefersReducedMotion,
    setImageSource,
    buildMvSearchUrl,
    getCountBadgeHtml,
    getCircleHeroMetaHtml: context.getCircleHeroMetaHtml,
    getHeroCoverBadgeHtml: context.getHeroCoverBadgeHtml,
    getPlatformPillsHtml,
    updateLikeButtonState: context.updateLikeButtonState,
    syncTopRunState: context.syncTopRunState,
    setHeroState: hookState.setHeroState,
    setSidebarState: hookState.setSidebarState,
  });
}

function createViewController({ context, elements, hookState, instance, renderController, root }) {
  return createKpopBanner105ViewController({
    instance,
    sourceSelect: elements.sourceSelect,
    periodSelect: elements.periodSelect,
    getPeriodLabel: context.getPeriodLabel,
    getKpoppingHistoryItems: context.getKpoppingHistoryItems,
    resolveKpoppingHistoryView: context.resolveKpoppingHistoryView,
    setHistoryState: hookState.setHistoryState,
    root,
    bannerDataUpdatedEvent: context.bannerDataUpdatedEvent,
    renderController,
    applyCurrentView: context.applyCurrentView,
    resolveAvailableView: context.resolveAvailableView,
    getStoredSource: context.getStoredSource,
    getStoredPeriod: context.getStoredPeriod,
    availablePeriods: context.availablePeriods,
    normalizeSelectedSource: context.normalizeSelectedSource,
    normalizeSelectedPeriod: context.normalizeSelectedPeriod,
    defaultPeriodForSource: context.defaultPeriodForSource,
    sourceNeedsCircleMultiData: context.sourceNeedsCircleMultiData,
    ensureCircleMultiDataAvailable: context.ensureCircleMultiDataAvailable,
    ensureKpoppingDataAvailable: context.ensureKpoppingDataAvailable,
    maybeCelebrateOnTopSongChange: context.maybeCelebrateOnTopSongChange,
    setPaginationState: hookState.setPaginationState,
    getPaginationForCurrentView: context.getPaginationForCurrentView,
  });
}

function createInteractionController({ context, elements, hookState, instance, root, viewController }) {
  return createKpopBanner105InteractionController({
    instance,
    root,
    modal: elements.modal,
    historyModal: elements.historyModal,
    modalCover: elements.modalCover,
    modalTitle: elements.modalTitle,
    modalArtist: elements.modalArtist,
    modalTotalPoints: elements.modalTotalPoints,
    modalContent: elements.modalContent,
    modalBadgeContainer: elements.modalBadgeContainer,
    modalTableTitle: elements.modalTableTitle,
    modalTableHead: elements.modalTableHead,
    modalTableBody: elements.modalTableBody,
    modalPointsSummary: elements.modalPointsSummary,
    openModalBtn: elements.openModalBtn,
    closeModalBtn: elements.closeModalBtn,
    closeHistoryBtn: elements.closeHistoryBtn,
    dismissBannerBtn: elements.dismissBannerBtn,
    confettiBtn: elements.confettiBtn,
    likeIcon: elements.likeIcon,
    heroCoverLink: elements.heroCoverLink,
    viewController,
    setImageSource,
    resolveIchartAggregatePoints: context.resolveIchartAggregatePoints,
    buildCircleModalTableHtml,
    buildMusicShowModalTableHtml,
    buildMusicShowRankModalTableHtml,
    buildIchartModalTableHtml,
    getCountBadgeHtml,
    getModalPlaceholderRowHtml,
    isBannerHiddenNow: context.isBannerHiddenNow,
    getReappearMinutes: context.getReappearMinutes,
    setHiddenUntil: context.setHiddenUntil,
    setModalState: hookState.setModalState,
    isSongLiked: context.isSongLiked,
    setSongLiked: context.setSongLiked,
    updateLikeButtonState: context.updateLikeButtonState,
    shouldCelebrateOnUserLike: context.shouldCelebrateOnUserLike,
    fireMultipleCannons: context.fireMultipleCannons,
    buildMvSearchUrl,
  });
}
