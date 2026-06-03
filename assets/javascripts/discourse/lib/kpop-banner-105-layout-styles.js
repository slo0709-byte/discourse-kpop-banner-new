export function applyBannerLayoutStyles(elements) {
	if (elements.modalContent instanceof HTMLElement) {
		elements.modalContent.style.backgroundColor = "var(--secondary)";
		elements.modalContent.style.border = "2px solid var(--primary-low-mid)";
		elements.modalContent.style.boxShadow =
			"0 16px 40px -12px rgba(0, 0, 0, 0.35)";
	}
	if (elements.sidebar instanceof HTMLElement) {
		elements.sidebar.style.display = "flex";
		elements.sidebar.style.visibility = "visible";
		elements.sidebar.style.opacity = "1";
	}
	if (elements.modalTableWrapper instanceof HTMLElement) {
		elements.modalTableWrapper.style.backgroundColor = "var(--bg-sidebar)";
	}

	elements.heroLeft.style.position = "relative";
	elements.heroLeft.style.display = "flex";
	elements.heroLeft.style.alignItems = "center";
	elements.heroLeft.style.height = "72px";
	elements.heroLeft.style.minHeight = "72px";
	elements.heroCoverLink.style.position = "relative";
	elements.heroCoverLink.style.display = "block";
	elements.heroCoverLink.style.width = "100%";
	elements.heroCoverLink.style.height = "100%";

	if (elements.mainRow instanceof HTMLElement) {
		elements.mainRow.style.height = "";
		elements.mainRow.style.backgroundColor = "var(--secondary)";
		elements.mainRow.style.borderColor = "var(--primary-low)";
		elements.mainRow.style.color = "var(--primary)";
		elements.mainRow.style.boxShadow = "none";
	}
	if (elements.heroMain instanceof HTMLElement) {
		elements.heroMain.style.alignItems = "stretch";
		elements.heroMain.style.gap = "10px";
		elements.heroMain.style.padding = "8px 10px";
	}
	if (elements.heroCenter instanceof HTMLElement) {
		elements.heroCenter.style.minHeight = "72px";
		elements.heroCenter.style.justifyContent = "center";
	}
	if (elements.heroInfoHeader instanceof HTMLElement) {
		elements.heroInfoHeader.style.gap = "2px";
		elements.heroInfoHeader.style.marginBottom = "8px";
	}
	if (elements.heroRight instanceof HTMLElement) {
		elements.heroRight.style.minHeight = "72px";
		elements.heroRight.style.justifyContent = "center";
		elements.heroRight.style.paddingLeft = "8px";
		elements.heroRight.style.paddingRight = "10px";
		elements.heroRight.style.gap = "8px";
	}
	if (elements.heroRankBadge instanceof HTMLElement) {
		elements.heroRankBadge.style.boxShadow = "none";
	}
	if (elements.heroGlow instanceof HTMLElement) {
		elements.heroGlow.style.display = "none";
	}

	elements.controlsRow.style.display = "flex";
	elements.controlsRow.style.alignItems = "center";
	elements.controlsRow.style.gap = "10px";
	elements.controlsRow.style.marginBottom = "12px";
	elements.controlsRow.style.width = "100%";
}
