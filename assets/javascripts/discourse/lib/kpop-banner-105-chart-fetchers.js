import { createEmptySongsBySource } from "./kpop-banner-105-chart-model.js";
import {
	mapCircleSong,
	mapSong,
} from "./kpop-banner-105-data-mappers.js";
import { getKpopBannerDataUrl } from "./kpop-banner-105-data-endpoints.js";
import { fetchJsonWithDedup } from "./kpop-banner-105-json-fetch.js";

export async function fetchUnifiedSongsFromNetwork(candidates) {
	const nextSongsBySource = createEmptySongsBySource();

	for (const url of candidates) {
		const data = await fetchJsonWithDedup(url);
		if (!data) {
			continue;
		}

		const ichartPeriods = data?.charts?.ichart?.periods || null;
		const mappedIchartDay = (
			Array.isArray(ichartPeriods?.day?.items)
				? ichartPeriods.day.items
				: Array.isArray(data?.charts?.ichart?.items)
					? data.charts.ichart.items
					: []
		)
			.map(mapSong)
			.filter((s) => s?.title && s?.artist);
		const mappedIchartWeek = (
			Array.isArray(ichartPeriods?.week?.items) ? ichartPeriods.week.items : []
		)
			.map(mapSong)
			.filter((s) => s?.title && s?.artist);
		const mappedCircle = (
			Array.isArray(data?.charts?.circlechart?.items)
				? data.charts.circlechart.items
				: []
		)
			.map((item) => mapCircleSong(item, "global", "day", "Circle Global"))
			.filter((s) => s?.title && s?.artist);
		const mappedSingle = (Array.isArray(data?.items) ? data.items : [])
			.map(mapSong)
			.filter((s) => s?.title && s?.artist);

		if (mappedIchartDay.length) {
			nextSongsBySource["ichart-day"] = mappedIchartDay;
		} else if (!nextSongsBySource["ichart-day"].length && mappedSingle.length) {
			nextSongsBySource["ichart-day"] = mappedSingle;
		}
		if (mappedIchartWeek.length) {
			nextSongsBySource["ichart-week"] = mappedIchartWeek;
		}
		if (mappedCircle.length) {
			nextSongsBySource["circle-global-day"] = mappedCircle;
		}
	}

	return nextSongsBySource;
}

export async function fetchCircleMultiSongsFromNetwork() {
	const nextSongsBySource = createEmptySongsBySource();
	const multi = await fetchJsonWithDedup(getKpopBannerDataUrl("circle"));

	if (!multi) {
		return nextSongsBySource;
	}

	const charts = Array.isArray(multi?.charts) ? multi.charts : [];
	charts.forEach((chart) => {
		const period = String(
			chart?.params?.termGbn || chart?.id?.split("_").pop() || "",
		).toLowerCase();
		if (!["day", "week", "month", "year"].includes(period)) {
			return;
		}

		let key = "";
		if (chart?.family === "global") {
			key = `circle-global-${period}`;
		} else if (chart?.family === "album") {
			key = `circle-album-${period}`;
		} else if (chart?.family === "onoff") {
			const service = String(chart?.params?.serviceGbn || "").toUpperCase();
			if (service !== "ALL") {
				return;
			}
			key = `circle-digital-${period}`;
		}

		if (!key || !(key in nextSongsBySource)) {
			return;
		}

		const mapped = (Array.isArray(chart?.items) ? chart.items : [])
			.map((item) =>
				mapCircleSong(
					item,
					chart.family,
					period,
					chart.label || chart.id || "Circle",
				),
			)
			.filter((s) => s?.title && s?.artist);

		if (mapped.length) {
			nextSongsBySource[key] = mapped;
		}
	});

	return nextSongsBySource;
}
