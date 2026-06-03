import { safeCssClass, safeHtmlText } from "./kpop-banner-105-html-safety.js";
import {
	isAllKillChartRow,
	matchesSongIdentity,
} from "./kpop-banner-105-utils.js";

export function createKpopBanner105PresentationHelpers({ getSongsBySource }) {
	function findMatchingWeekSong(song) {
		return (
			(getSongsBySource()["ichart-week"] || []).find((item) =>
				matchesSongIdentity(item, song),
			) || null
		);
	}

	function hasRealtimeRankOne(song, platformName) {
		return (Array.isArray(song?.detailRows) ? song.detailRows : []).some(
			(row) =>
				row?.platform === platformName &&
				Number(row?.rank) === 1 &&
				isAllKillChartRow(platformName, row?.chartName),
		);
	}

	function hasIchartWeeklyRankOne(song) {
		const detailMatch = (
			Array.isArray(song?.detailRows) ? song.detailRows : []
		).some(
			(row) =>
				row?.platform === "iChart" &&
				Number(row?.rank) === 1 &&
				String(row?.chartName || "").includes("周榜"),
		);

		if (detailMatch) {
			return true;
		}

		return Number(findMatchingWeekSong(song)?.rank) === 1;
	}

	function getIchartAchievement(song) {
		if (!song || song.chartFamily) {
			return "";
		}

		const requiredPlatforms = [
			"YouTube",
			"Melon",
			"Genie",
			"Flo",
			"VIBE",
			"Bugs",
		];
		const hasAllKill = requiredPlatforms.every((platformName) =>
			hasRealtimeRankOne(song, platformName),
		);
		if (!hasAllKill) {
			return "";
		}

		return hasIchartWeeklyRankOne(song) ? "PAK" : "AK";
	}

	function resolveIchartAggregatePoints(song) {
		if (!song || song.chartFamily) {
			return song?.points || "-";
		}

		const weekMatch = findMatchingWeekSong(song);
		if (weekMatch?.points) {
			return weekMatch.points;
		}

		return song.points || "-";
	}

	function getHeroCoverBadgeHtml(song) {
		const achievementLevel = getIchartAchievement(song);
		if (achievementLevel === "PAK") {
			return '<div class="kpop-celebration__cover-badge"><span class="kpop-celebration__cover-badge-main">PAK</span><span class="kpop-celebration__cover-badge-sub">ALL KILL</span></div>';
		}
		if (achievementLevel === "AK") {
			return '<div class="kpop-celebration__cover-badge"><span class="kpop-celebration__cover-badge-main is-rak">AK</span><span class="kpop-celebration__cover-badge-sub">ALL KILL</span></div>';
		}
		return "";
	}

	return {
		resolveIchartAggregatePoints,
		getHeroCoverBadgeHtml,
	};
}

export function setImageSource(img, src, alt) {
	if (!(img instanceof HTMLImageElement)) {
		return;
	}

	img.alt = alt || "";
	img.onload = null;
	img.classList.remove("is-visible");

	if (!src) {
		img.removeAttribute("src");
		return;
	}

	img.onload = () => {
		img.classList.add("is-visible");
	};
	img.src = src;

	if (img.complete && img.naturalWidth > 0) {
		img.classList.add("is-visible");
	}
}

export function getCircleHeroMetaHtml(song) {
	const familyLabel =
		song.chartFamily === "global"
			? "Global K-pop"
			: song.chartFamily === "album"
				? "Album Chart"
				: "Digital Chart";
	const periodLabel =
		song.chartPeriod === "year"
			? "年榜"
			: song.chartPeriod === "month"
				? "月榜"
				: song.chartPeriod === "week"
					? "周榜"
					: "日榜";
	const certLabel = song.circleMeta?.cert
		? `<span class="circle-badge cert">🏅 ${safeHtmlText(song.circleMeta.cert)}</span>`
		: "";

	return `<div class="kpop-celebration__circle-meta"><div class="circle-badges-row"><span class="circle-badge ${safeCssClass(song.chartFamily)}">${familyLabel}</span><span class="circle-badge period">${periodLabel}</span>${certLabel}</div></div>`;
}
