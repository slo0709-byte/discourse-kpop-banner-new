export function collectBannerElements(root) {
  const modal = root.querySelector("#details-modal");
  const historyModal = root.querySelector("#history-modal");
  return {
    closeHistoryBtn: root.querySelector("#close-history-btn"),
    closeModalBtn: root.querySelector("#close-modal-btn"),
    confettiBtn: root.querySelector("#confetti-btn"),
    controlsRow: root.querySelector(".kpop-controls-row"),
    dismissBannerBtn: root.querySelector("#close-banner-btn"),
    heroArtist: root.querySelector("#hero-artist"),
    heroCenter: root.querySelector(".kpop-celebration__center"),
    heroCover: root.querySelector("#hero-cover"),
    heroCoverBadgeContainer: root.querySelector("#hero-cover-badge-container"),
    heroCoverLink: root.querySelector(".kpop-celebration__cover-link"),
    heroExtraInfo: root.querySelector("#hero-extra-info"),
    heroGlow: root.querySelector(".kpop-celebration__glow"),
    heroInfoHeader: root.querySelector(".kpop-celebration__info-header"),
    heroLeft: root.querySelector(".kpop-celebration__left"),
    heroMain: root.querySelector(".kpop-celebration__hero-main"),
    heroPoints: root.querySelector("#hero-points"),
    heroPointsLabel: root.querySelector("#hero-points-label"),
    heroRank: root.querySelector("#hero-rank"),
    heroRankBadge: root.querySelector(".kpop-celebration__rank-badge"),
    heroRight: root.querySelector(".kpop-celebration__right"),
    heroStatusWrap: root.querySelector("#hero-status-wrap"),
    heroTitle: root.querySelector("#hero-title"),
    historyModal,
    likeIcon: root.querySelector(".kpop-celebration__like-icon"),
    mainRow: root.querySelector(".kpop-celebration__main-row"),
    modal,
    modalArtist: modal?.querySelector("#modal-artist"),
    modalBadgeContainer: modal?.querySelector("#modal-badge-container"),
    modalContent: modal?.querySelector(".kpop-modal-content"),
    modalCover: modal?.querySelector("#modal-cover"),
    modalPointsSummary: root.querySelector("#modal-points-summary"),
    modalTableBody: root.querySelector("#modal-table-body"),
    modalTableHead: root.querySelector("#modal-table-head"),
    modalTableTitle: root.querySelector("#modal-table-title"),
    modalTableWrapper: modal?.querySelector(".kpop-modal-table-wrapper"),
    modalTitle: modal?.querySelector("#modal-title"),
    modalTotalPoints: modal?.querySelector("#modal-total-points"),
    openModalBtn: root.querySelector("#open-modal-btn"),
    periodSelect: root.querySelector("#kpop-period-select"),
    sidebar: root.querySelector(".kpop-celebration__mini-sidebar"),
    sourceSelect: root.querySelector("#kpop-source-select"),
  };
}

export function hasRequiredBannerElements(elements) {
  return !!(
    elements.sidebar &&
    elements.heroTitle &&
    elements.heroRank &&
    elements.heroArtist &&
    elements.heroCover &&
    elements.heroCoverLink &&
    elements.heroLeft &&
    elements.heroPoints &&
    elements.heroPointsLabel &&
    elements.heroStatusWrap &&
    elements.heroExtraInfo &&
    elements.modal &&
    elements.historyModal &&
    elements.openModalBtn &&
    elements.closeModalBtn &&
    elements.closeHistoryBtn &&
    elements.modalCover &&
    elements.modalTitle &&
    elements.modalArtist &&
    elements.modalTotalPoints &&
    elements.modalBadgeContainer &&
    elements.modalTableBody &&
    elements.modalTableHead &&
    elements.modalTableTitle &&
    elements.modalPointsSummary &&
    elements.dismissBannerBtn &&
    elements.controlsRow &&
    elements.sourceSelect &&
    elements.periodSelect
  );
}
