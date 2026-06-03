export function bindBannerEvents({ elements, interactionController, root, viewController, bannerDataUpdatedEvent }) {
  viewController.handleSidebarClick = (event) => {
    const target =
      event.target instanceof Element
        ? event.target.closest(".kpop-celebration__mini-item")
        : null;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    viewController.showSongAt(
      Number.parseInt(target.getAttribute("data-index") || "0", 10),
    );
  };

  elements.sidebar.addEventListener("click", viewController.handleSidebarClick);
  if (root.dataset.kpopDataListener !== "1") {
    window.addEventListener(bannerDataUpdatedEvent, viewController.handleDataUpdated);
    root.dataset.kpopDataListener = "1";
  }

  elements.openModalBtn.addEventListener("click", interactionController.openModal);
  elements.closeModalBtn.addEventListener("click", interactionController.closeModal);
  elements.closeHistoryBtn.addEventListener(
    "click",
    interactionController.closeHistoryModal,
  );
  elements.modal.addEventListener(
    "click",
    interactionController.handleModalBackdropClick,
  );
  elements.historyModal.addEventListener(
    "click",
    interactionController.handleHistoryModalClick,
  );
  elements.modal.addEventListener("keydown", interactionController.handleModalKeydown);
  root.addEventListener("click", interactionController.handleRootClick);
  elements.dismissBannerBtn.addEventListener(
    "click",
    interactionController.hideBannerTemporarily,
  );
  elements.sourceSelect.addEventListener("change", viewController.handleSourceChange);
  elements.periodSelect.addEventListener("change", viewController.handlePeriodChange);
  elements.heroCoverLink.addEventListener(
    "click",
    interactionController.openCurrentSongVideo,
  );

  return () => {
    elements.sidebar.removeEventListener("click", viewController.handleSidebarClick);
    window.removeEventListener(bannerDataUpdatedEvent, viewController.handleDataUpdated);
    root.dataset.kpopDataListener = "0";
    elements.openModalBtn.removeEventListener("click", interactionController.openModal);
    elements.closeModalBtn.removeEventListener("click", interactionController.closeModal);
    elements.closeHistoryBtn.removeEventListener(
      "click",
      interactionController.closeHistoryModal,
    );
    elements.modal.removeEventListener(
      "click",
      interactionController.handleModalBackdropClick,
    );
    elements.historyModal.removeEventListener(
      "click",
      interactionController.handleHistoryModalClick,
    );
    elements.modal.removeEventListener("keydown", interactionController.handleModalKeydown);
    root.removeEventListener("click", interactionController.handleRootClick);
    elements.dismissBannerBtn.removeEventListener(
      "click",
      interactionController.hideBannerTemporarily,
    );
    elements.sourceSelect.removeEventListener("change", viewController.handleSourceChange);
    elements.periodSelect.removeEventListener("change", viewController.handlePeriodChange);
    elements.heroCoverLink.removeEventListener(
      "click",
      interactionController.openCurrentSongVideo,
    );
    root.dataset.kpopBound = "0";
  };
}
