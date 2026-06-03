function songIdentity(song) {
  return `${song?.detailUrl || ""}|${song?.title || ""}|${song?.artist || ""}`;
}

function topSongForSource(songsBySource) {
  return (
    (songsBySource["ichart-day"] || []).find((song) => Number(song?.rank) === 1) ||
    (songsBySource["ichart-week"] || []).find((song) => Number(song?.rank) === 1) ||
    null
  );
}

export function createKpopBanner105LikeState({
  bannerStorage,
  fireMultipleCannons,
  getSongsBySource,
}) {
  const readLikeCelebrationState = () => bannerStorage.readLikeCelebrationState();
  const writeLikeCelebrationState = (state) =>
    bannerStorage.writeLikeCelebrationState(state);

  const isSongLiked = (song) => {
    const state = readLikeCelebrationState();
    return !!state[songIdentity(song)]?.liked;
  };

  const setSongLiked = (song, liked) => {
    const state = readLikeCelebrationState();
    const key = songIdentity(song);
    const current = state[key] || {
      activeTopRun: false,
      celebrated: false,
      liked: false,
    };
    current.liked = liked;
    if (!liked) {
      current.celebrated = false;
    }
    state[key] = current;
    writeLikeCelebrationState(state);
  };

  const syncTopRunState = (song) => {
    const state = readLikeCelebrationState();
    const key = songIdentity(song);
    Object.keys(state).forEach((songKey) => {
      if (songKey !== key && state[songKey]?.activeTopRun) {
        state[songKey].activeTopRun = false;
        state[songKey].celebrated = false;
      }
    });

    if (!song || song.chartFamily || Number(song.rank) !== 1) {
      writeLikeCelebrationState(state);
      return;
    }

    const current = state[key] || {
      activeTopRun: false,
      celebrated: false,
      liked: false,
    };
    current.activeTopRun = true;
    state[key] = current;
    writeLikeCelebrationState(state);
  };

  const shouldCelebrateOnUserLike = (song) => {
    if (!song || song.chartFamily || Number(song.rank) !== 1) {
      return false;
    }

    const state = readLikeCelebrationState();
    const key = songIdentity(song);
    const current = state[key] || {
      activeTopRun: false,
      celebrated: false,
      liked: false,
    };
    if (!current.liked) {
      state[key] = current;
      writeLikeCelebrationState(state);
      return false;
    }
    if (!current.activeTopRun) {
      current.activeTopRun = true;
      current.celebrated = false;
    }
    if (current.celebrated) {
      state[key] = current;
      writeLikeCelebrationState(state);
      return false;
    }
    current.celebrated = true;
    state[key] = current;
    writeLikeCelebrationState(state);
    return true;
  };

  const maybeCelebrateOnTopSongChange = (instance) => {
    const songsBySource = getSongsBySource();
    const topSong = topSongForSource(songsBySource);
    const nextTopKey = topSong ? songIdentity(topSong) : "";
    if (!instance || !nextTopKey || nextTopKey === instance.lastRenderedSongKey) {
      return;
    }
    instance.lastRenderedSongKey = nextTopKey;
    if (!shouldCelebrateOnUserLike(topSong)) {
      return;
    }

    fireMultipleCannons([
      "#f472b6",
      "#60a5fa",
      "#4ade80",
      "#fb7185",
      "#c084fc",
      "#fcd34d",
      "#ffffff",
    ]);
  };

  const updateLikeButtonState = (button, song) => {
    if (!(button instanceof HTMLElement)) {
      return;
    }
    const activeButton = button.id
      ? button.ownerDocument?.getElementById(button.id) || button
      : button;
    if (!(activeButton instanceof HTMLElement)) {
      return;
    }
    const liked = isSongLiked(song);
    activeButton.classList.toggle("is-liked", liked);
    activeButton.dataset.liked = liked ? "1" : "0";
    activeButton.setAttribute("aria-pressed", liked ? "true" : "false");
    activeButton.setAttribute("aria-label", liked ? "取消点赞" : "点赞");
    activeButton.setAttribute("title", liked ? "取消点赞" : "点赞");
    const icon = activeButton.querySelector(".kpop-celebration__like-icon");
    if (icon instanceof HTMLElement) {
      icon.textContent = liked ? "♥" : "♡";
    }
  };

  return {
    isSongLiked,
    maybeCelebrateOnTopSongChange,
    setSongLiked,
    shouldCelebrateOnUserLike,
    syncTopRunState,
    updateLikeButtonState,
  };
}
