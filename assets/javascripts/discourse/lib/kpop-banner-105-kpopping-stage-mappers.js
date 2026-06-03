import { normalizeKpoppingThumbnail } from "./kpop-banner-105-kpopping-utils.js";

function mapKpoppingPerformance(performance, episode) {
  const badges = Array.isArray(performance?.badges)
    ? performance.badges.map((badge) => String(badge || "").toUpperCase()).filter((badge) => badge && badge !== "PLAYING")
    : [];
  const videoId = String(performance?.youtube_video_id || "").trim();
  const songTitle = performance?.song || "-";
  const artist = performance?.artist || "-";

  return {
    rank: Number.isFinite(Number(performance?.order)) ? Number(performance.order) : "-",
    title: songTitle,
    artist,
    currentScore: 0,
    points: Number.isFinite(Number(performance?.order)) ? `#${Number(performance.order)}` : "STAGE",
    pointsLabel: "STAGE ORDER",
    pakCount: 0,
    rakCount: 0,
    imageUrl: normalizeKpoppingThumbnail(performance?.thumbnail) || normalizeKpoppingThumbnail(episode?.thumbnail),
    detailUrl: episode?.source_url || "",
    mvUrl: videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : episode?.source_url || "",
    trend: performance?.is_winner ? "up" : "same",
    trendVal: performance?.is_winner ? "WIN" : "",
    platforms: [],
    tableDetails: null,
    chartFamily: "music_show",
    chartLabel: "Kpopping 打歌节目",
    chartPeriod: "stages",
    musicShowMeta: {
      sourceUrl: episode?.source_url || "",
      showName: episode?.show_name || "-",
      episodeNumber: episode?.episode_number || "-",
      airDate: episode?.air_date || "-",
      winnerSong: episode?.winner_song || "-",
      winnerArtist: episode?.winner_artist || "-",
      winnerPerformed: !!episode?.winner_performed,
      reportedPerformanceCount: episode?.reported_performance_count || episode?.parsed_performance_count || "-",
      stageOrder: Number.isFinite(Number(performance?.order)) ? Number(performance.order) : "-",
      youtubeVideoId: videoId,
      badges,
      isWinner: !!performance?.is_winner || badges.includes("WINNER"),
      isComeback: !!performance?.is_comeback || badges.includes("COMEBACK"),
      isDebut: !!performance?.is_debut || badges.includes("DEBUT"),
    },
  };
}

export function getKpoppingEpisodeLabel(episode, fallbackIndex) {
  const showName = episode?.show_name || "Kpopping";
  const episodeNumber = episode?.episode_number ? ` EP.${episode.episode_number}` : "";
  const airDate = episode?.air_date ? ` · ${episode.air_date}` : "";
  return `${showName}${episodeNumber}${airDate}` || `往期节目 ${fallbackIndex + 1}`;
}

export function mapKpoppingEpisode(episode, period = "stages") {
  const performances = Array.isArray(episode?.performances) ? episode.performances : [];
  return performances
    .filter((performance) => performance?.song && performance?.artist)
    .map((performance) => ({
      ...mapKpoppingPerformance(performance, episode),
      chartPeriod: period,
    }));
}

export function buildKpoppingHistoryItem(episode, index) {
  const period = `ep${index}`;
  return {
    period,
    title: `${episode?.show_name || "Kpopping"} EP.${episode?.episode_number || "-"}`,
    date: episode?.air_date || "-",
    winner: `${episode?.winner_artist || "-"} - ${episode?.winner_song || "-"}`,
  };
}

export function selectLatestKpoppingEpisode(episodes) {
  return (Array.isArray(episodes) ? episodes : []).find((episode) => Array.isArray(episode?.performances) && episode.performances.length > 0) || null;
}
