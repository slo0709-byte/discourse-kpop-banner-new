import { normalizeKpoppingThumbnail } from "./kpop-banner-105-kpopping-utils.js";

export function buildKpoppingWinRankings(episodes) {
  const songWins = new Map();
  const artistWins = new Map();

  (Array.isArray(episodes) ? episodes : []).forEach((episode) => {
    const winnerArtist = String(episode?.winner_artist || "").trim();
    const winnerSong = String(episode?.winner_song || "").trim();
    if (!winnerArtist || !winnerSong) {
      return;
    }

    const songKey = `${winnerArtist}|||${winnerSong}`;
    const currentSong = songWins.get(songKey) || {
      artist: winnerArtist,
      title: winnerSong,
      wins: 0,
      shows: new Set(),
      imageUrl: normalizeKpoppingThumbnail(episode?.thumbnail),
    };
    currentSong.wins += 1;
    currentSong.shows.add(episode?.show_name || "Kpopping");
    songWins.set(songKey, currentSong);

    const currentArtist = artistWins.get(winnerArtist) || {
      artist: winnerArtist,
      title: winnerArtist,
      totalWins: 0,
      winningSongs: new Set(),
      shows: new Set(),
      imageUrl: normalizeKpoppingThumbnail(episode?.thumbnail),
    };
    currentArtist.totalWins += 1;
    currentArtist.winningSongs.add(winnerSong);
    currentArtist.shows.add(episode?.show_name || "Kpopping");
    artistWins.set(winnerArtist, currentArtist);
  });

  const songRows = Array.from(songWins.values())
    .sort((left, right) => right.wins - left.wins || left.title.localeCompare(right.title))
    .map((item, index) => ({
      rank: index + 1,
      title: item.title,
      artist: item.artist,
      points: `🏆 ${item.wins}`,
      pointsLabel: "TOTAL WINS",
      imageUrl: item.imageUrl,
      trend: "same",
      trendVal: "",
      platforms: [],
      chartFamily: "music_show_rank",
      chartLabel: "歌曲一位榜",
      chartPeriod: "song-wins",
      musicShowRankMeta: {
        wins: item.wins,
        shows: Array.from(item.shows),
        winningSongs: 1,
      },
    }));

  const artistRows = Array.from(artistWins.values())
    .sort((left, right) => right.totalWins - left.totalWins || left.artist.localeCompare(right.artist))
    .map((item, index) => ({
      rank: index + 1,
      title: item.artist,
      artist: `${item.winningSongs.size} 首夺冠歌曲`,
      points: `🏆 ${item.totalWins}`,
      pointsLabel: "TOTAL WINS",
      imageUrl: item.imageUrl,
      trend: "same",
      trendVal: "",
      platforms: [],
      chartFamily: "music_show_rank",
      chartLabel: "艺人总榜",
      chartPeriod: "artist-wins",
      musicShowRankMeta: {
        wins: item.totalWins,
        shows: Array.from(item.shows),
        winningSongs: item.winningSongs.size,
        songs: Array.from(item.winningSongs),
      },
    }));

  return { songRows, artistRows };
}

export function buildPrecomputedKpoppingWinRankings(summary) {
  const songRows = (Array.isArray(summary?.songWins) ? summary.songWins : [])
    .filter((item) => item?.title && item?.artist && Number(item?.wins) > 0)
    .map((item, index) => ({
      rank: Number(item.rank) || index + 1,
      title: item.title,
      artist: item.artist,
      points: `🏆 ${Number(item.wins)}`,
      pointsLabel: "TOTAL WINS",
      imageUrl: normalizeKpoppingThumbnail(item.thumbnail),
      trend: "same",
      trendVal: "",
      platforms: [],
      chartFamily: "music_show_rank",
      chartLabel: "歌曲一位榜",
      chartPeriod: "song-wins",
      musicShowRankMeta: {
        wins: Number(item.wins),
        shows: Array.isArray(item.showBreakdown) && item.showBreakdown.length
          ? item.showBreakdown.map((show) => `${show.show} ${show.wins}`)
          : [],
        showBreakdown: Array.isArray(item.showBreakdown) ? item.showBreakdown : [],
        winningSongs: 1,
      },
    }));

  const artistRows = (Array.isArray(summary?.artistWins) ? summary.artistWins : [])
    .filter((item) => item?.artist && Number(item?.wins) > 0)
    .map((item, index) => ({
      rank: Number(item.rank) || index + 1,
      title: item.artist,
      artist: Array.isArray(item.songBreakdown) && item.songBreakdown.length
        ? `${item.songBreakdown.length} 首夺冠歌曲`
        : "Kpopping 累计一位",
      points: `🏆 ${Number(item.wins)}`,
      pointsLabel: "TOTAL WINS",
      imageUrl: normalizeKpoppingThumbnail(item.thumbnail),
      trend: "same",
      trendVal: "",
      platforms: [],
      chartFamily: "music_show_rank",
      chartLabel: "艺人总榜",
      chartPeriod: "artist-wins",
      musicShowRankMeta: {
        wins: Number(item.wins),
        shows: Array.isArray(item.showBreakdown) && item.showBreakdown.length
          ? item.showBreakdown.map((show) => `${show.show} ${show.wins}`)
          : [],
        showBreakdown: Array.isArray(item.showBreakdown) ? item.showBreakdown : [],
        winningSongs: Array.isArray(item.songBreakdown) ? item.songBreakdown.length : 0,
        songs: Array.isArray(item.songBreakdown) && item.songBreakdown.length
          ? item.songBreakdown.map((song) => `${song.title} ${song.wins}`)
          : [],
        songBreakdown: Array.isArray(item.songBreakdown) ? item.songBreakdown : [],
      },
    }));

  return { songRows, artistRows };
}

export function buildSoridataWinRankings(summary) {
  const songRows = (Array.isArray(summary?.songWins) ? summary.songWins : [])
    .filter((item) => item?.title && item?.artist && Number(item?.wins) > 0)
    .map((item, index) => ({
      rank: index + 1,
      title: item.title,
      artist: item.artist,
      points: `🏆 ${Number(item.wins)}`,
      pointsLabel: summary?.year ? `${summary.year} WINS` : "TOTAL WINS",
      imageUrl: "",
      trend: "same",
      trendVal: "",
      platforms: [],
      chartFamily: "music_show_rank",
      chartLabel: "歌曲一位榜",
      chartPeriod: "song-wins",
      musicShowRankMeta: {
        wins: Number(item.wins),
        shows: Array.isArray(item.awardDetails?.byShow) && item.awardDetails.byShow.length
          ? item.awardDetails.byShow.map((show) => `${show.show} ${show.wins}`)
          : [],
        showBreakdown: Array.isArray(item.awardDetails?.byShow) ? item.awardDetails.byShow : [],
        yearBreakdown: Array.isArray(item.awardDetails?.byYear) ? item.awardDetails.byYear : [],
        winningSongs: 1,
      },
    }));

  const artistRows = (Array.isArray(summary?.artistWins) ? summary.artistWins : [])
    .filter((item) => item?.artist && Number(item?.wins) > 0)
    .map((item, index) => ({
      rank: index + 1,
      title: item.artist,
      artist: item.mostAwardedSong
        ? `代表曲：${item.mostAwardedSong}`
        : "Soridata 累计一位",
      points: `🏆 ${Number(item.wins)}`,
      pointsLabel: "TOTAL WINS",
      imageUrl: "",
      trend: "same",
      trendVal: "",
      platforms: [],
      chartFamily: "music_show_rank",
      chartLabel: "艺人总榜",
      chartPeriod: "artist-wins",
      musicShowRankMeta: {
        wins: Number(item.wins),
        shows: Array.isArray(item.awardDetails?.byShow) && item.awardDetails.byShow.length
          ? item.awardDetails.byShow.map((show) => `${show.show} ${show.wins}`)
          : [],
        showBreakdown: Array.isArray(item.awardDetails?.byShow) ? item.awardDetails.byShow : [],
        yearBreakdown: Array.isArray(item.awardDetails?.byYear) ? item.awardDetails.byYear : [],
        winningSongs: Number(item.mostAwardedSongWins) || 0,
        songs: Array.isArray(item.awardDetails?.topSongs) && item.awardDetails.topSongs.length
          ? item.awardDetails.topSongs.map((song) => `${song.title} ${song.wins}`)
          : item.mostAwardedSong ? [item.mostAwardedSong] : [],
        songBreakdown: Array.isArray(item.awardDetails?.topSongs) ? item.awardDetails.topSongs : [],
        detailUrl: item.detailUrl || "",
      },
    }));

  return { songRows, artistRows };
}
