import { createEmptySongsBySource, kpoppingEpisodePeriodCount } from "./kpop-banner-105-chart-model.js";
import {
	buildKpoppingHistoryItem,
	buildKpoppingWinRankings,
	buildPrecomputedKpoppingWinRankings,
	buildSoridataWinRankings,
	getKpoppingEpisodeLabel,
	mapKpoppingEpisode,
	selectLatestKpoppingEpisode,
} from "./kpop-banner-105-data-mappers.js";
import fallbackKpoppingEpisodes from "./kpop-banner-105-kpopping-data.js";
import fallbackSoridataMusicShowWins from "./kpop-banner-105-soridata-data.js";
import {
	hasAnySongs,
	recordSoridataPagination,
} from "./kpop-banner-105-data-state.js";
import { fetchJsonWithDedup } from "./kpop-banner-105-json-fetch.js";

export async function fetchKpoppingSongsFromNetwork(candidates, periodLabels) {
	const nextSongsBySource = createEmptySongsBySource();
	const applyKpoppingEpisodes = (episodes, summary = null) => {
		const usableEpisodes = (Array.isArray(episodes) ? episodes : [])
			.filter(
				(episode) =>
					Array.isArray(episode?.performances) &&
					episode.performances.length > 0,
			)
			.slice(0, kpoppingEpisodePeriodCount);
		const latestEpisode = selectLatestKpoppingEpisode(usableEpisodes);
		const mapped = mapKpoppingEpisode(latestEpisode, "stages");

		if (!mapped.length) {
			return false;
		}

		const precomputedRankings = summary
			? buildPrecomputedKpoppingWinRankings(summary)
			: null;
		const rankings = precomputedRankings?.songRows?.length
			? precomputedRankings
			: buildKpoppingWinRankings(usableEpisodes);
		nextSongsBySource["kpopping-stages"] = mapped;
		nextSongsBySource["kpopping-song-wins"] = rankings.songRows;
		nextSongsBySource["kpopping-artist-wins"] = rankings.artistRows;
		nextSongsBySource["kpopping-history"] = usableEpisodes.map(
			buildKpoppingHistoryItem,
		);

		usableEpisodes.forEach((episode, index) => {
			const period = `ep${index}`;
			const episodeMapped = mapKpoppingEpisode(episode, period);
			if (episodeMapped.length) {
				nextSongsBySource[`kpopping-${period}`] = episodeMapped;
				periodLabels.set(period, getKpoppingEpisodeLabel(episode, index));
			}
		});
		return true;
	};

	for (const url of candidates) {
		const data = await fetchJsonWithDedup(url);
		if (!data) {
			continue;
		}

		const episodes = Array.isArray(data)
			? data
			: Array.isArray(data?.data)
				? data.data
			: Array.isArray(data?.episodes)
				? data.episodes
				: Array.isArray(data?.charts?.kpopping?.episodes)
					? data.charts.kpopping.episodes
					: [];

		if (applyKpoppingEpisodes(episodes, Array.isArray(data) ? null : data)) {
			break;
		}
	}

	if (!hasAnySongs(nextSongsBySource)) {
		applyKpoppingEpisodes(fallbackKpoppingEpisodes);
	}

	return nextSongsBySource;
}

export async function fetchSoridataRankingsFromNetwork(candidates, options = {}) {
	const nextSongsBySource = createEmptySongsBySource();
	const applySoridataSummary = (summary) => {
		recordSoridataPagination(summary, options.chart || "");
		const rankings = buildSoridataWinRankings(summary);
		if (!rankings.songRows.length && !rankings.artistRows.length) {
			return false;
		}

		nextSongsBySource["kpopping-song-wins"] = rankings.songRows;
		nextSongsBySource["kpopping-artist-wins"] = rankings.artistRows;
		return true;
	};

	for (const url of candidates) {
		const data = await fetchJsonWithDedup(url);
		if (data && applySoridataSummary(data)) {
			break;
		}
	}

	if (!hasAnySongs(nextSongsBySource)) {
		applySoridataSummary(fallbackSoridataMusicShowWins);
	}

	return nextSongsBySource;
}
