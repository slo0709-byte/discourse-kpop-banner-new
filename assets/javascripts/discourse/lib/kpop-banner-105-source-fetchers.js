import {
  createEmptySongsBySource,
  kpoppingEpisodePeriodCount,
} from "./kpop-banner-105-chart-model.js";
import {
  buildKpoppingHistoryItem,
  buildKpoppingWinRankings,
  buildPrecomputedKpoppingWinRankings,
  buildSoridataWinRankings,
  getKpoppingEpisodeLabel,
  mapCircleSong,
  mapKpoppingEpisode,
  mapSong,
  selectLatestKpoppingEpisode,
} from "./kpop-banner-105-data-mappers.js";
import fallbackKpoppingEpisodes from "./kpop-banner-105-kpopping-data.js";
import fallbackSoridataMusicShowWins from "./kpop-banner-105-soridata-data.js";
import { getKpopBannerDataUrl } from "./kpop-banner-105-settings.js";

const jsonRequestPromises = new Map();

export async function fetchJsonWithDedup(url) {
  const promiseKey = `json:${url}`;
  if (jsonRequestPromises.has(promiseKey)) {
    return jsonRequestPromises.get(promiseKey);
  }

  const promise = (async () => {
    const resp = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!resp.ok) {
      return null;
    }
    return resp.json();
  })()
    .catch(() => null)
    .finally(() => {
      jsonRequestPromises.delete(promiseKey);
    });

  jsonRequestPromises.set(promiseKey, promise);
  return promise;
}

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
    ).map(mapSong).filter((s) => s?.title && s?.artist);
    const mappedIchartWeek = (
      Array.isArray(ichartPeriods?.week?.items) ? ichartPeriods.week.items : []
    ).map(mapSong).filter((s) => s?.title && s?.artist);
    const mappedCircle = (
      Array.isArray(data?.charts?.circlechart?.items)
        ? data.charts.circlechart.items
        : []
    ).map((item) => mapCircleSong(item, "global", "day", "Circle Global"))
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
        mapCircleSong(item, chart.family, period, chart.label || chart.id || "Circle"),
      )
      .filter((s) => s?.title && s?.artist);

    if (mapped.length) {
      nextSongsBySource[key] = mapped;
    }
  });

  return nextSongsBySource;
}

export async function fetchKpoppingSongsFromNetwork(candidates, setPeriodLabel) {
  const nextSongsBySource = createEmptySongsBySource();
  const applyKpoppingEpisodes = (episodes, summary = null) => {
    const usableEpisodes = (Array.isArray(episodes) ? episodes : [])
      .filter(
        (episode) =>
          Array.isArray(episode?.performances) && episode.performances.length > 0,
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
    nextSongsBySource["kpopping-history"] = usableEpisodes.map(buildKpoppingHistoryItem);

    usableEpisodes.forEach((episode, index) => {
      const period = `ep${index}`;
      const episodeMapped = mapKpoppingEpisode(episode, period);
      if (episodeMapped.length) {
        nextSongsBySource[`kpopping-${period}`] = episodeMapped;
        setPeriodLabel(period, getKpoppingEpisodeLabel(episode, index));
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

  if (!Object.values(nextSongsBySource).some((items) => Array.isArray(items) && items.length)) {
    applyKpoppingEpisodes(fallbackKpoppingEpisodes);
  }

  return nextSongsBySource;
}

export async function fetchSoridataRankingsFromNetwork(candidates, options = {}) {
  const nextSongsBySource = createEmptySongsBySource();
  const applySoridataSummary = (summary) => {
    options.recordSoridataPagination?.(summary, options.chart || "");
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

  if (!Object.values(nextSongsBySource).some((items) => Array.isArray(items) && items.length)) {
    applySoridataSummary(fallbackSoridataMusicShowWins);
  }

  return nextSongsBySource;
}
