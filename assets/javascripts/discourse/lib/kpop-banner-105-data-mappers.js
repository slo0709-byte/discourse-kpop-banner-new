import {
  normalizePlatformName,
  trendFromChange,
  trendFromMovement,
} from "./kpop-banner-105-utils.js";

export function mapSong(item) {
  const rows = Array.isArray(item?.platformBreakdown) ? item.platformBreakdown : [];
  const seen = new Set();
  const platforms = [];
  const detailRows = [];

  rows.forEach((row) => {
    const info = normalizePlatformName(row?.platform);
    const rowTrend = trendFromChange(row?.change);
    const key = info.name.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      platforms.push({
        name: info.name,
        rank: Number.isFinite(Number(row?.rank)) ? Number(row.rank) : "-",
        class: info.class,
        trend: rowTrend.trend,
        trendVal: rowTrend.trendVal,
      });
    }

    detailRows.push({
      platform: info.name,
      colorClass: info.colorClass,
      chartName: row?.chartName || "",
      rank: Number.isFinite(Number(row?.rank)) ? Number(row.rank) : "-",
      score: Number.isFinite(Number(row?.originScore)) ? `${Number(row.originScore)}` : Number.isFinite(Number(row?.score)) ? `${Number(row.score)}` : "-",
      multi: row?.extra || "-",
      trend: rowTrend.trend,
      trendVal: rowTrend.trendVal,
    });
  });

  const pakCount = Number(item?.pakCount) || 0;
  const rakCount = Number(item?.rakCount) || 0;
  const movementTrend = trendFromMovement(item?.movement);

  return {
    rank: Number.isFinite(Number(item?.rank)) ? Number(item.rank) : "-",
    title: item?.title || "-",
    artist: item?.artist || "-",
    currentScore: Number(item?.score) || 0,
    totalScore: Number.isFinite(Number(item?.totalScore)) ? Number(item.totalScore).toLocaleString("en-US") : "",
    points: Number.isFinite(Number(item?.score)) ? Number(item.score).toLocaleString("en-US") : "-",
    pakCount,
    rakCount,
    imageUrl: item?.albumImage || "",
    detailUrl: item?.detailUrl || "",
    mvUrl: item?.mvUrl || item?.videoUrl || item?.youtubeUrl || "",
    trend: movementTrend.trend,
    trendVal: movementTrend.trendVal,
    platforms: platforms.length ? platforms : [{ name: "Melon", rank: "-", class: "is-melon", trend: "same", trendVal: "" }],
    detailRows,
    tableDetails: null,
  };
}

export function mapCircleSong(item, family, period, label) {
  const movementTrend = trendFromMovement(item?.movement);
  const song = {
    rank: Number.isFinite(Number(item?.rank)) ? Number(item.rank) : "-",
    title: item?.title || "-",
    artist: item?.artist || "-",
    currentScore: 0,
    points: "-",
    pointsLabel: "CIRCLE",
    pakCount: 0,
    rakCount: 0,
    imageUrl: item?.albumImage || "",
    detailUrl: "",
    mvUrl: "",
    trend: movementTrend.trend,
    trendVal: movementTrend.trendVal,
    platforms: [],
    tableDetails: null,
    chartFamily: family,
    chartLabel: label,
    chartPeriod: period,
    circleMeta: {
      album: item?.album || "",
      companyMake: item?.companyMake || "",
      companyDist: item?.companyDist || "",
      cert: item?.raw?.cert || "",
      count: item?.raw?.count || "",
      albumCnt: item?.raw?.albumCnt || "",
      totalCnt: item?.raw?.totalCnt || "",
    },
  };

  if (family === "global") {
    song.pointsLabel = "CIRCLE GLOBAL";
    song.points = "GLOBAL";
    song.platforms = [
      { name: "Global", rank: song.rank, class: "is-youtube", trend: song.trend, trendVal: song.trendVal },
    ];
    return song;
  }

  if (family === "onoff") {
    const count = Number(item?.raw?.count || 0);
    song.currentScore = Number.isFinite(count) ? count : 0;
    song.points = Number.isFinite(count) && count > 0 ? count.toLocaleString("en-US") : "-";
    song.pointsLabel = "CIRCLE INDEX";
    song.platforms = [
      { name: "Digital", rank: song.rank, class: "is-genie", trend: song.trend, trendVal: song.trendVal },
    ];
    return song;
  }

  const albumCnt = Number(item?.raw?.albumCnt || 0);
  song.currentScore = Number.isFinite(albumCnt) ? albumCnt : 0;
  song.points = Number.isFinite(albumCnt) && albumCnt > 0 ? albumCnt.toLocaleString("en-US") : "-";
  song.pointsLabel = "ALBUM SALES";
  song.platforms = [
    { name: "Album", rank: song.rank, class: "is-bugs", trend: song.trend, trendVal: song.trendVal },
  ];
  return song;
}

export {
  buildKpoppingHistoryItem,
  getKpoppingEpisodeLabel,
  mapKpoppingEpisode,
  selectLatestKpoppingEpisode,
} from "./kpop-banner-105-kpopping-stage-mappers.js";
export {
  buildKpoppingWinRankings,
  buildPrecomputedKpoppingWinRankings,
  buildSoridataWinRankings,
} from "./kpop-banner-105-music-show-rankings.js";
