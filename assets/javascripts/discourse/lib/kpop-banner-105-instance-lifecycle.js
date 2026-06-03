export function createBannerInstance(root) {
  return {
    root,
    allSongs: [],
    currentSource: "ichart",
    currentPeriod: "day",
    currentSongIndex: 0,
    modalDetailRenderToken: 0,
    previousBodyOverflow: "",
    lastFocusedElement: null,
    lastRenderedSongKey: "",
  };
}

export function ensureSingleBannerRoot() {
  const roots = Array.from(document.querySelectorAll("[data-kpop-banner]"));
  if (roots.length <= 1) {
    return;
  }

  const preferred =
    roots.find(
      (root) =>
        root.closest(".above-main-container") ||
        root.closest(".above-main-container-outlet"),
    ) || roots[0];

  roots.forEach((root) => {
    if (root !== preferred) {
      root.remove();
    }
  });
}

const bannerCleanupRegistry = new WeakMap();

export function getBannerCleanup(root) {
  return bannerCleanupRegistry.get(root);
}

export function setBannerCleanup(root, cleanup) {
  bannerCleanupRegistry.set(root, cleanup);
}

export function deleteBannerCleanup(root) {
  bannerCleanupRegistry.delete(root);
}
