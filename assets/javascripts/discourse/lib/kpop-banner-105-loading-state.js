import { loadingPlatformMarqueeHtml } from "./kpop-banner-105-render-utils.js";

export function renderLoadingState({ elements, root, setHeroState, setModalState, setSidebarState, viewController }) {
  root.dataset.kpopLoading = "1";
  elements.heroRank.textContent = "-";
  elements.heroTitle.textContent = "加载中...";
  elements.heroArtist.textContent = "排行榜数据加载中";
  elements.heroPoints.textContent = "--";
  elements.heroPointsLabel.textContent = "LOADING";
  setHeroState({
    rank: "-",
    title: "加载中...",
    artist: "排行榜数据加载中",
    points: "--",
    pointsLabel: "LOADING",
    isMusicShow: false,
    hideLikeButton: false,
    winnerArtist: "",
    winnerSong: "",
    coverSrc: "",
    coverAlt: "",
    coverHref: "#",
    coverAriaLabel: "Open music video in a new tab",
    badgeHtml: "",
    extraInfoHtml: loadingPlatformMarqueeHtml,
  });
  elements.heroStatusWrap.innerHTML =
    '<div class="kpop-celebration__badge kpop-celebration__badge--loading"><span class="kpop-celebration__badge-text">SYNC</span></div>';
  elements.heroExtraInfo.innerHTML = loadingPlatformMarqueeHtml;
  elements.heroCover.removeAttribute("src");
  elements.heroCoverLink.removeAttribute("href");
  if (elements.heroCoverBadgeContainer) {
    elements.heroCoverBadgeContainer.innerHTML = "";
  }
  setSidebarState([
    loadingSidebarItem(0, true),
    loadingSidebarItem(1, false),
    loadingSidebarItem(2, false),
  ]);
  setModalState({
    title: "",
    artist: "",
    totalPoints: "0",
    coverSrc: "",
    coverAlt: "",
    badgeHtml: "",
    tableTitle: "各平台实时排名数据",
    tableHeadHtml: "",
    tableBodyHtml: "",
    pointsTitle: "iChart 综合总分",
    pointsSummaryVisible: true,
  });
  elements.openModalBtn.disabled = true;
  viewController.setSelectControls();
  root.dataset.kpopBound = "pending";
}

function loadingSidebarItem(index, isTop) {
  return {
    index,
    rank: String(index + 1),
    title: "加载中...",
    trend: "same",
    trendVal: "...",
    isTop,
    isActive: index === 0,
    isUp: false,
    isDown: false,
  };
}
